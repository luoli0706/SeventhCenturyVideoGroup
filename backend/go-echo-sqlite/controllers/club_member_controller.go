package controllers

import (
	"net/http"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/config"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/models"

	"github.com/labstack/echo/v4"
)

// 获取所有社团成员
func GetClubMembers(c echo.Context) error {
	var members []models.ClubMember
	result := config.DB.Find(&members)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": result.Error.Error()})
	}
	return c.JSON(http.StatusOK, members)
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
