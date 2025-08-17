package controllers

import (
	"net/http"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/config"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/models"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
)

var jwtSecret = []byte("seventhcentury-secret-key")

type Claims struct {
	CN       string `json:"cn"`
	IsMember bool   `json:"is_member"`
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
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "用户名或密码错误"})
	}

	// 验证密码
	if err := bcrypt.CompareHashAndPassword([]byte(member.Password), []byte(req.Password)); err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "用户名或密码错误"})
	}

	// 生成JWT
	claims := &Claims{
		CN:       member.CN,
		IsMember: member.IsMember,
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
		"message":   "登录成功",
	})
}

// Register 用户注册
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

	// 检查用户是否已存在
	var existingMember models.ClubMember
	result := config.DB.Where("cn = ?", req.CN).First(&existingMember)
	if result.Error == nil {
		return c.JSON(http.StatusConflict, echo.Map{"error": "用户名已存在"})
	}

	// 加密密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "密码加密失败"})
	}

	// 创建新用户
	member := models.ClubMember{
		CN:        req.CN,
		Password:  string(hashedPassword),
		Sex:       req.Sex,
		Position:  req.Position,
		Year:      req.Year,
		Direction: req.Direction,
		Status:    req.Status,
		IsMember:  true, // 注册的用户默认为社团成员
		Remark:    req.Remark,
	}

	if err := config.DB.Create(&member).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "注册失败"})
	}

	return c.JSON(http.StatusCreated, echo.Map{
		"message": "注册成功",
		"cn":      member.CN,
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
