package config

import (
	"seventhcenturyvideogroup/backend/go-echo-sqlite/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB
var DBName = "app.db" // 只在这里定义

func InitDB() {
	var err error
	DB, err = gorm.Open(sqlite.Open(DBName), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}

	// 自动迁移模型
	DB.AutoMigrate(&models.ClubMember{}, &models.Activity{}, &models.MemberProfile{}, &models.MemoryCode{})
}
