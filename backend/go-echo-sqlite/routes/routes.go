package routes

import (
	"seventhcenturyvideogroup/backend/go-echo-sqlite/controllers"

	"github.com/labstack/echo/v4"
)

func InitRoutes(e *echo.Echo) {
	api := e.Group("/api")

	api.GET("/club_members", controllers.GetClubMembers)
	api.POST("/club_members", controllers.CreateClubMember)
	api.DELETE("/club_members/:id", controllers.DeleteClubMember)
}
