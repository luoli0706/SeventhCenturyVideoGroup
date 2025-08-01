package controllers

import (
	"net/http"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/config"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/models"

	"github.com/labstack/echo/v4"
)

// GetMemberProfile 获取成员个人主页信息
func GetMemberProfile(c echo.Context) error {
	cn := c.Param("cn")
	if cn == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "成员姓名不能为空"})
	}

	var profile models.MemberProfile
	result := config.DB.Where("cn = ?", cn).First(&profile)
	if result.Error != nil {
		// 如果没找到个人主页，返回404
		return c.JSON(http.StatusNotFound, echo.Map{"error": "未找到该成员的个人主页"})
	}

	return c.JSON(http.StatusOK, profile)
}

// CreateOrUpdateMemberProfile 创建或更新成员个人主页
func CreateOrUpdateMemberProfile(c echo.Context) error {
	cn := c.Param("cn")
	if cn == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "成员姓名不能为空"})
	}

	var profile models.MemberProfile
	if err := c.Bind(&profile); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	// 确保CN字段正确
	profile.CN = cn

	// 检查是否已存在该成员的个人主页
	var existingProfile models.MemberProfile
	result := config.DB.Where("cn = ?", cn).First(&existingProfile)

	if result.Error != nil {
		// 不存在，创建新的
		createResult := config.DB.Create(&profile)
		if createResult.Error != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"error": createResult.Error.Error()})
		}
		return c.JSON(http.StatusCreated, profile)
	} else {
		// 已存在，更新
		profile.ID = existingProfile.ID
		updateResult := config.DB.Save(&profile)
		if updateResult.Error != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"error": updateResult.Error.Error()})
		}
		return c.JSON(http.StatusOK, profile)
	}
}

// DeleteMemberProfile 删除成员个人主页
func DeleteMemberProfile(c echo.Context) error {
	cn := c.Param("cn")
	if cn == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "成员姓名不能为空"})
	}

	result := config.DB.Where("cn = ?", cn).Delete(&models.MemberProfile{})
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": result.Error.Error()})
	}

	if result.RowsAffected == 0 {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "未找到该成员的个人主页"})
	}

	return c.NoContent(http.StatusNoContent)
}

// CheckMemberProfileExists 检查成员个人主页是否存在
func CheckMemberProfileExists(c echo.Context) error {
	cn := c.Param("cn")
	if cn == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "成员姓名不能为空"})
	}

	var count int64
	config.DB.Model(&models.MemberProfile{}).Where("cn = ?", cn).Count(&count)

	return c.JSON(http.StatusOK, echo.Map{
		"exists": count > 0,
		"cn":     cn,
	})
}
