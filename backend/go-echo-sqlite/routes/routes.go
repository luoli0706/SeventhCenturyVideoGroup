package routes

import (
	"seventhcenturyvideogroup/backend/go-echo-sqlite/controllers"

	"github.com/labstack/echo/v4"
)

func InitRoutes(e *echo.Echo) {
	api := e.Group("/api")

	// 认证相关路由（无需权限）
	api.POST("/login", controllers.Login)
	api.POST("/register", controllers.Register)
	api.POST("/forgot-password", controllers.ForgotPassword)
	api.POST("/change-password", controllers.ChangePassword)
	api.GET("/memory-code", controllers.GetMemoryCode)

	// 公开路由（访客可访问）
	api.GET("/club_members", controllers.GetClubMembers)
	api.GET("/activities", controllers.GetActivities)

	// 需要社团成员权限的路由
	api.DELETE("/club_members/:id", controllers.RequireMember(controllers.DeleteClubMember))
	api.POST("/activities", controllers.RequireMember(controllers.CreateActivity))

	// 个人主页相关路由（需要成员权限）
	api.GET("/member-profile/:cn", controllers.GetMemberProfile)
	api.POST("/member-profile/:cn", controllers.RequireMember(controllers.CreateOrUpdateMemberProfile))
	api.PUT("/member-profile/:cn", controllers.RequireMember(controllers.CreateOrUpdateMemberProfile))
	api.DELETE("/member-profile/:cn", controllers.RequireMember(controllers.DeleteMemberProfile))
	api.GET("/member-profile/:cn/exists", controllers.CheckMemberProfileExists)

	// RAG AI助手相关路由
	api.POST("/rag/initialize", controllers.InitializeRAG) // 初始化RAG系统
	api.POST("/rag/query", controllers.QueryRAG)           // RAG查询（仅检索）
	api.POST("/rag/chat", controllers.QueryRAGWithN8N)     // RAG聊天（检索+n8n）
	api.GET("/rag/documents", controllers.GetDocuments)    // 获取文档列表
	api.GET("/rag/faqs", controllers.GetFAQs)              // 获取FAQ列表
}
