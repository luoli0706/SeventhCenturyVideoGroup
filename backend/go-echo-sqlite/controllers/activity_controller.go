package controllers

import (
	"net/http"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/config"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/models"

	"github.com/labstack/echo/v4"
)

func GetActivities(c echo.Context) error {
	var activities []models.Activity
	result := config.DB.Order("time desc").Find(&activities)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": result.Error.Error()})
	}
	return c.JSON(http.StatusOK, activities)
}

func CreateActivity(c echo.Context) error {
	var activity models.Activity
	if err := c.Bind(&activity); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}
	result := config.DB.Create(&activity)
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": result.Error.Error()})
	}
	return c.JSON(http.StatusCreated, activity)
}
