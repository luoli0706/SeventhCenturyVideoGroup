package routes

import (
	"seventhcenturyvideogroup/backend/go-echo-sqlite/controllers"

	"github.com/labstack/echo/v4"
)

func InitRoutes(e *echo.Echo) {
	api := e.Group("/api")

	// 认证相关路由（无需权限）
	//
	// 全部限流：匿名每 IP 每分钟 5 次，管理员 50 次（审批页会连续刷新/批量处理）。
	// 这几个接口是登录爆破、注册灌水、备忘码撞码的入口，且除 change-password
	// 外都无需认证。每条路由各持一套独立的水桶，互不挤占。
	api.POST("/login", controllers.Login, controllers.RateLimit(5, 50))
	api.POST("/register", controllers.Register, controllers.RateLimit(5, 50)) // 提交注册申请，审批通过后才创建成员
	api.GET("/register/check-cn", controllers.CheckCN, controllers.RateLimit(5, 50))
	api.POST("/forgot-password", controllers.ForgotPassword, controllers.RateLimit(5, 50))
	api.POST("/change-password", controllers.ChangePassword, controllers.RateLimit(5, 50))
	api.GET("/memory-code", controllers.RequireAdmin(controllers.GetMemoryCode))

	// 注册审批（仅管理员）。限流排在 RequireAdmin 之前，未携带 token 的
	// 探测请求也照样计数，否则绕过鉴权失败就等于绕过限流。
	admin := api.Group("/admin", controllers.RateLimit(5, 50), controllers.RequireAdmin)
	admin.GET("/applications", controllers.ListApplications)
	admin.POST("/applications/:id/approve", controllers.ApproveApplication)
	admin.POST("/applications/:id/reject", controllers.RejectApplication)

	// 公开路由（访客可访问）
	api.GET("/club_members", controllers.GetClubMembers)
	api.GET("/activities", controllers.GetActivities)

	// 需要社团成员权限的路由
	api.DELETE("/club_members/:id", controllers.RequireMember(controllers.DeleteClubMember))
	api.POST("/activities", controllers.RequireMember(controllers.CreateActivity))
	api.POST("/upload/image", controllers.RequireMember(controllers.UploadImage))
	api.POST("/upload/delete", controllers.RequireMember(controllers.DeleteUploadedImage))

	// 个人主页相关路由（需要成员权限）
	api.GET("/member-profile/:cn", controllers.GetMemberProfile)
	api.POST("/member-profile/:cn", controllers.RequireMember(controllers.CreateOrUpdateMemberProfile))
	api.PUT("/member-profile/:cn", controllers.RequireMember(controllers.CreateOrUpdateMemberProfile))
	api.DELETE("/member-profile/:cn", controllers.RequireMember(controllers.DeleteMemberProfile))
	api.GET("/member-profile/:cn/exists", controllers.CheckMemberProfileExists)

	// 知识库管理（需要成员权限）
	kb := api.Group("/kb", controllers.RequireMember)
	kb.GET("/tree", controllers.KBTree)
	kb.GET("/read", controllers.KBRead)
	kb.POST("/save", controllers.KBSave)
	kb.POST("/create", controllers.KBCreate)
	kb.DELETE("/delete", controllers.KBDelete)

}
