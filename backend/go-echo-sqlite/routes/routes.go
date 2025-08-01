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

	api.GET("/activities", controllers.GetActivities)
	api.POST("/activities", controllers.CreateActivity)

	// 个人主页相关路由
	api.GET("/member-profile/:cn", controllers.GetMemberProfile)
	api.POST("/member-profile/:cn", controllers.CreateOrUpdateMemberProfile)
	api.PUT("/member-profile/:cn", controllers.CreateOrUpdateMemberProfile)
	api.DELETE("/member-profile/:cn", controllers.DeleteMemberProfile)
	api.GET("/member-profile/:cn/exists", controllers.CheckMemberProfileExists)
}
