package controllers

import (
	"fmt"
	"net/http"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/config"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/models"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/services"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// applicationDTO 审批接口的响应结构。
// 显式列出字段：既避免 gorm.Model 的 PascalCase key 混进接口，
// 也保证密码哈希在任何情况下都不会被序列化出去。
type applicationDTO struct {
	ID           uint       `json:"id"`
	CN           string     `json:"cn"`
	Sex          string     `json:"sex"`
	Position     string     `json:"position"`
	Year         string     `json:"year"`
	Direction    string     `json:"direction"`
	Status       string     `json:"status"`
	Remark       string     `json:"remark"`
	State        string     `json:"state"`
	RejectReason string     `json:"reject_reason"`
	ReviewedBy   string     `json:"reviewed_by"`
	ReviewedAt   *time.Time `json:"reviewed_at"`
	CreatedAt    time.Time  `json:"created_at"`
}

func toApplicationDTO(a models.RegistrationApplication) applicationDTO {
	return applicationDTO{
		ID:           a.ID,
		CN:           a.CN,
		Sex:          a.Sex,
		Position:     a.Position,
		Year:         a.Year,
		Direction:    a.Direction,
		Status:       a.Status,
		Remark:       a.Remark,
		State:        a.State,
		RejectReason: a.RejectReason,
		ReviewedBy:   a.ReviewedBy,
		ReviewedAt:   a.ReviewedAt,
		CreatedAt:    a.CreatedAt,
	}
}

// CheckCN 检查昵称能否使用，供注册页在提交前给出提示。
//
// 判断口径与 Register 保持一致（已是成员 / 有待审申请），否则会出现
// 「页面说能用、提交却被拒」的矛盾。
//
// 关于探测面：它只回布尔值与一句笼统说明，泄露的信息不超过
// POST /api/register 的返回值（提交时同样会因重名被拒），也不超过
// 本就公开且无门槛的 /api/club_members 成员名单，因此不构成新的探测面。
func CheckCN(c echo.Context) error {
	cn := strings.TrimSpace(c.QueryParam("cn"))
	if cn == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "缺少 cn 参数"})
	}

	var member models.ClubMember
	if err := config.DB.Where("cn = ?", cn).First(&member).Error; err == nil {
		return c.JSON(http.StatusOK, echo.Map{
			"available": false,
			"message":   "该昵称已被使用，请换一个",
		})
	}

	var pending models.RegistrationApplication
	if err := config.DB.Where("cn = ? AND state = ?", cn, models.ApplicationPending).
		First(&pending).Error; err == nil {
		return c.JSON(http.StatusOK, echo.Map{
			"available": false,
			"message":   "该昵称已提交过申请，正在审核中",
		})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"available": true,
		"message":   "该昵称可以使用",
	})
}

// ListApplications 列出注册申请（管理员）。
// 查询参数 state: pending | approved | rejected | all，默认 pending。
func ListApplications(c echo.Context) error {
	state := c.QueryParam("state")
	if state == "" {
		state = models.ApplicationPending
	}

	// 白名单校验，避免把原始查询串直接带进 SQL
	switch state {
	case models.ApplicationPending, models.ApplicationApproved, models.ApplicationRejected, "all":
	default:
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "无效的状态参数"})
	}

	query := config.DB.Order("id DESC")
	if state != "all" {
		query = query.Where("state = ?", state)
	}

	var applications []models.RegistrationApplication
	if err := query.Find(&applications).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "获取申请列表失败"})
	}

	items := make([]applicationDTO, 0, len(applications))
	for _, application := range applications {
		items = append(items, toApplicationDTO(application))
	}

	return c.JSON(http.StatusOK, echo.Map{
		"applications": items,
		"total":        len(items),
	})
}

// ApproveApplication 批准注册申请并创建成员账号（管理员）。
func ApproveApplication(c echo.Context) error {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "无效的申请ID"})
	}

	reviewer, _ := c.Get("user_cn").(string)

	var application models.RegistrationApplication
	if err := config.DB.First(&application, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "申请不存在"})
	}

	if application.State != models.ApplicationPending {
		return c.JSON(http.StatusConflict, echo.Map{"error": "该申请已被处理"})
	}

	// 防御性检查：该用户名可能已被别的途径占用
	var existingMember models.ClubMember
	if err := config.DB.Where("cn = ?", application.CN).First(&existingMember).Error; err == nil {
		return c.JSON(http.StatusConflict, echo.Map{"error": "该用户名已存在成员，无法批准"})
	}

	now := time.Now()
	var member models.ClubMember

	// 建成员与改申请状态必须同生共死
	err = config.DB.Transaction(func(tx *gorm.DB) error {
		member = models.ClubMember{
			CN:        application.CN,
			Password:  application.Password, // 复用申请阶段已加密的哈希
			Sex:       application.Sex,
			Position:  application.Position,
			Year:      application.Year,
			Direction: application.Direction,
			Status:    application.Status,
			IsMember:  true,
			IsAdmin:   false,
			Remark:    application.Remark,
		}
		if err := tx.Create(&member).Error; err != nil {
			return err
		}

		return tx.Model(&models.RegistrationApplication{}).
			Where("id = ?", application.ID).
			Updates(map[string]interface{}{
				"state":       models.ApplicationApproved,
				"reviewed_by": reviewer,
				"reviewed_at": now,
			}).Error
	})

	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "批准失败"})
	}

	// 审批通过、成为正式成员之后，才同步到知识库
	go func() {
		if err := services.SyncNewMember(&member); err != nil {
			config.DB.Model(&member).Update("remark",
				fmt.Sprintf("%s [KB同步失败: %v]", member.Remark, err))
		}
	}()

	return c.JSON(http.StatusOK, echo.Map{
		"message": "已批准，该成员现在可以登录",
		"cn":      member.CN,
	})
}

// RejectApplication 拒绝注册申请（管理员）。必须填写拒绝理由。
func RejectApplication(c echo.Context) error {
	type RejectRequest struct {
		Reason string `json:"reason"`
	}

	var req RejectRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "请求格式错误"})
	}

	reason := strings.TrimSpace(req.Reason)
	if reason == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "请填写拒绝理由"})
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "无效的申请ID"})
	}

	reviewer, _ := c.Get("user_cn").(string)

	var application models.RegistrationApplication
	if err := config.DB.First(&application, id).Error; err != nil {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "申请不存在"})
	}

	if application.State != models.ApplicationPending {
		return c.JSON(http.StatusConflict, echo.Map{"error": "该申请已被处理"})
	}

	// 申请记录保留在库里，仅标记为已拒绝，申请人可重新提交
	if err := config.DB.Model(&models.RegistrationApplication{}).
		Where("id = ?", application.ID).
		Updates(map[string]interface{}{
			"state":         models.ApplicationRejected,
			"reject_reason": reason,
			"reviewed_by":   reviewer,
			"reviewed_at":   time.Now(),
		}).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "拒绝失败"})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"message": "已拒绝该申请",
		"cn":      application.CN,
	})
}
