package controllers

import (
	"errors"
	"fmt"
	"net/http"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/config"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/models"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var jwtSecret = []byte("seventhcentury-secret-key")

type Claims struct {
	CN       string `json:"cn"`
	IsMember bool   `json:"is_member"`
	IsAdmin  bool   `json:"is_admin"`
	jwt.RegisteredClaims
}

// Login 用户登录
func Login(c echo.Context) error {
	type LoginRequest struct {
		CN       string `json:"cn"`
		Password string `json:"password"`
	}

	var req LoginRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "请求格式错误"})
	}

	if req.CN == "" || req.Password == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "用户名和密码不能为空"})
	}

	// 查找用户
	var member models.ClubMember
	result := config.DB.Where("cn = ?", req.CN).First(&member)
	if result.Error != nil {
		// 还不是成员：可能是待审 / 被拒的注册申请
		return loginNotYetMember(c, req.CN, req.Password)
	}

	// 验证密码
	if err := bcrypt.CompareHashAndPassword([]byte(member.Password), []byte(req.Password)); err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "用户名或密码错误"})
	}

	// 生成JWT
	claims := &Claims{
		CN:       member.CN,
		IsMember: member.IsMember,
		IsAdmin:  member.IsAdmin,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "生成token失败"})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"token":     tokenString,
		"cn":        member.CN,
		"is_member": member.IsMember,
		"is_admin":  member.IsAdmin,
		"message":   "登录成功",
	})
}

// loginNotYetMember 处理「尚未成为成员」的登录。
// 若该 cn 存在匹配的注册申请，按申请状态给出明确提示；否则维持原有的 401。
// 先校验密码再提示，避免仅凭 cn 就能探知某人是否提交过申请。
func loginNotYetMember(c echo.Context, cn, password string) error {
	var application models.RegistrationApplication
	// 取该 cn 最新的一条申请
	if err := config.DB.Where("cn = ?", cn).Order("id DESC").First(&application).Error; err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "用户名或密码错误"})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(application.Password), []byte(password)); err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "用户名或密码错误"})
	}

	switch application.State {
	case models.ApplicationPending:
		return c.JSON(http.StatusForbidden, echo.Map{"error": "您的注册申请正在审核中，请耐心等待"})
	case models.ApplicationRejected:
		message := "您的注册申请未通过审核"
		if application.RejectReason != "" {
			message = fmt.Sprintf("%s：%s", message, application.RejectReason)
		}
		return c.JSON(http.StatusForbidden, echo.Map{"error": message})
	}

	return c.JSON(http.StatusUnauthorized, echo.Map{"error": "用户名或密码错误"})
}

// Register 提交注册申请。审批通过后才会创建成员账号（见 ApproveApplication）。
func Register(c echo.Context) error {
	type RegisterRequest struct {
		CN        string `json:"cn"`
		Password  string `json:"password"`
		Sex       string `json:"sex"`
		Position  string `json:"position"`
		Year      string `json:"year"`
		Direction string `json:"direction"`
		Status    string `json:"status"`
		Remark    string `json:"remark"`
	}

	var req RegisterRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "请求格式错误"})
	}

	if req.CN == "" || req.Password == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "用户名和密码不能为空"})
	}

	if len(req.Password) < 6 {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "密码长度至少6位"})
	}

	// 已是社团成员
	var existingMember models.ClubMember
	if err := config.DB.Where("cn = ?", req.CN).First(&existingMember).Error; err == nil {
		return c.JSON(http.StatusConflict, echo.Map{"error": "用户名已存在"})
	}

	// 已有一条待审核的申请
	var pendingApplication models.RegistrationApplication
	err := config.DB.Where("cn = ? AND state = ?", req.CN, models.ApplicationPending).
		First(&pendingApplication).Error
	if err == nil {
		return c.JSON(http.StatusConflict, echo.Map{"error": "您已提交申请，正在审核中"})
	}

	// 加密密码（申请阶段即加密存储，批准时直接复用该哈希）
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "密码加密失败"})
	}

	application := models.RegistrationApplication{
		CN:        req.CN,
		Password:  string(hashedPassword),
		Sex:       req.Sex,
		Position:  req.Position,
		Year:      req.Year,
		Direction: req.Direction,
		Status:    req.Status,
		Remark:    req.Remark,
		State:     models.ApplicationPending,
	}

	if err := config.DB.Create(&application).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "提交申请失败"})
	}

	return c.JSON(http.StatusCreated, echo.Map{
		"message": "申请已提交，请等待管理员审核",
		"cn":      application.CN,
	})
}

// VerifyToken 验证JWT中间件
func VerifyToken(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		tokenString := c.Request().Header.Get("Authorization")
		if tokenString == "" {
			return c.JSON(http.StatusUnauthorized, echo.Map{"error": "未提供认证token"})
		}

		// 移除 "Bearer " 前缀
		if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
			tokenString = tokenString[7:]
		}

		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			return c.JSON(http.StatusUnauthorized, echo.Map{"error": "无效的token"})
		}

		// 将用户信息存储到context中
		c.Set("user_cn", claims.CN)
		c.Set("is_member", claims.IsMember)
		c.Set("is_admin", claims.IsAdmin)

		// token 里的身份只是签发那一刻的快照，有效期 24h。直接采信意味着
		// 把某人撤下管理员（或除名）后，其旧 token 还能照用一整天 —— 对
		// 一个审批系统来说，撤权不生效是实打实的问题。这里按 cn 回查一次。
		var member models.ClubMember
		err = config.DB.Where("cn = ?", claims.CN).First(&member).Error
		switch {
		case err == nil:
			c.Set("is_member", member.IsMember)
			c.Set("is_admin", member.IsAdmin)
		case errors.Is(err, gorm.ErrRecordNotFound):
			// 账号已被删除：立刻失去一切权限
			c.Set("is_member", false)
			c.Set("is_admin", false)
		default:
			// 数据库故障：保留 token 内的声明。宁可短暂放宽，也不因为
			// 一次查询抖动把全站已登录用户踢成 403。
		}

		return next(c)
	}
}

// RequireMember 需要社团成员权限的中间件
func RequireMember(next echo.HandlerFunc) echo.HandlerFunc {
	return VerifyToken(func(c echo.Context) error {
		isMember, ok := c.Get("is_member").(bool)
		if !ok || !isMember {
			return c.JSON(http.StatusForbidden, echo.Map{"error": "访客无法访问该功能"})
		}
		return next(c)
	})
}

// RequireAdmin 需要管理员权限的中间件
func RequireAdmin(next echo.HandlerFunc) echo.HandlerFunc {
	return VerifyToken(func(c echo.Context) error {
		isAdmin, ok := c.Get("is_admin").(bool)
		if !ok || !isAdmin {
			return c.JSON(http.StatusForbidden, echo.Map{"error": "需要管理员权限"})
		}
		return next(c)
	})
}
