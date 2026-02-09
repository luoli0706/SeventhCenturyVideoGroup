package controllers

import (
	"net/http"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/config"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/models"

	"github.com/labstack/echo/v4"
)

type ClubMemberPublic struct {
	CN        string `json:"cn"`
	Sex       string `json:"sex"`
	Position  string `json:"position"`
	Year      string `json:"year"`
	Direction string `json:"direction"`
	Status    string `json:"status"`
	IsMember  bool   `json:"is_member"`
	Remark    string `json:"remark"`
}

func toClubMemberPublic(member models.ClubMember) ClubMemberPublic {
	return ClubMemberPublic{
		CN:        member.CN,
		Sex:       member.Sex,
		Position:  member.Position,
		Year:      member.Year,
		Direction: member.Direction,
		Status:    member.Status,
		IsMember:  member.IsMember,
		Remark:    member.Remark,
	}
}

// 获取所有社团成员
func GetClubMembers(c echo.Context) error {
	var members []models.ClubMember
	result := config.DB.Select("cn", "sex", "position", "year", "direction", "status", "is_member", "remark").Find(&members)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": result.Error.Error()})
	}
	publicMembers := make([]ClubMemberPublic, 0, len(members))
	for _, m := range members {
		publicMembers = append(publicMembers, toClubMemberPublic(m))
	}
	return c.JSON(http.StatusOK, publicMembers)
}

// MCP: 根据 cn 获取成员信息（需要成员权限；查询无 cn 限制）
func GetClubMemberByCN(c echo.Context) error {
	targetCN := c.Param("cn")
	actorCN, _ := c.Get("user_cn").(string)
	if actorCN == "" {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "未提供认证token"})
	}

	var member models.ClubMember
	result := config.DB.Where("cn = ?", targetCN).First(&member)
	if result.Error != nil {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "成员不存在"})
	}

	return c.JSON(http.StatusOK, toClubMemberPublic(member))
}

// MCP: 更新自己的成员信息（除 password 外）
func UpdateClubMemberByCN(c echo.Context) error {
	targetCN := c.Param("cn")
	actorCN, _ := c.Get("user_cn").(string)
	if actorCN == "" {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "未提供认证token"})
	}
	if actorCN != targetCN && !isMCPAdminCN(actorCN) {
		return c.JSON(http.StatusForbidden, echo.Map{"error": "无权修改他人信息"})
	}

	type UpdateRequest struct {
		Sex       *string `json:"sex"`
		Position  *string `json:"position"`
		Year      *string `json:"year"`
		Direction *string `json:"direction"`
		Status    *string `json:"status"`
		IsMember  *bool   `json:"is_member"`
		Remark    *string `json:"remark"`
	}

	var req UpdateRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "请求格式错误"})
	}

	var member models.ClubMember
	result := config.DB.Where("cn = ?", targetCN).First(&member)
	if result.Error != nil {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "成员不存在"})
	}

	updates := map[string]interface{}{}
	if req.Sex != nil {
		updates["sex"] = *req.Sex
	}
	if req.Position != nil {
		updates["position"] = *req.Position
	}
	if req.Year != nil {
		updates["year"] = *req.Year
	}
	if req.Direction != nil {
		updates["direction"] = *req.Direction
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}
	if req.IsMember != nil {
		updates["is_member"] = *req.IsMember
	}
	if req.Remark != nil {
		updates["remark"] = *req.Remark
	}

	if len(updates) == 0 {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "未提供可更新字段"})
	}

	if err := config.DB.Model(&member).Updates(updates).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "更新失败"})
	}

	// reload
	_ = config.DB.Where("cn = ?", targetCN).First(&member).Error
	return c.JSON(http.StatusOK, toClubMemberPublic(member))
}

// MCP: 删除自己的成员信息
func DeleteClubMemberByCN(c echo.Context) error {
	targetCN := c.Param("cn")
	actorCN, _ := c.Get("user_cn").(string)
	if actorCN == "" {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "未提供认证token"})
	}
	if actorCN != targetCN && !isMCPAdminCN(actorCN) {
		return c.JSON(http.StatusForbidden, echo.Map{"error": "无权删除他人信息"})
	}

	result := config.DB.Where("cn = ?", targetCN).Delete(&models.ClubMember{})
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "删除失败"})
	}
	if result.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "成员不存在"})
	}
	return c.NoContent(http.StatusNoContent)
}

// 新增社团成员
func CreateClubMember(c echo.Context) error {
	var member models.ClubMember
	if err := c.Bind(&member); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	result := config.DB.Create(&member)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": result.Error.Error()})
	}
	return c.JSON(http.StatusCreated, member)
}

// 根据ID删除社团成员
func DeleteClubMember(c echo.Context) error {
	id := c.Param("id")
	result := config.DB.Delete(&models.ClubMember{}, id)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": result.Error.Error()})
	}
	return c.NoContent(http.StatusNoContent)
}
