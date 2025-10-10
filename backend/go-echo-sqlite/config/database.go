package config

import (
	"fmt"
	"os"
	"path/filepath"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB
var DBName = "app.db" // 只在这里定义

func InitDB() {
	// 调试信息
	currentDir, _ := os.Getwd()
	fmt.Printf("Current working directory: %s\n", currentDir)

	// 获取绝对路径
	dbPath, _ := filepath.Abs(DBName)
	fmt.Printf("Database path: %s\n", dbPath)

	// 检查文件是否存在
	if _, err := os.Stat(DBName); os.IsNotExist(err) {
		fmt.Printf("Database file %s does not exist, will be created\n", DBName)
	} else {
		fmt.Printf("Database file %s exists\n", DBName)
	}

	var err error
	DB, err = gorm.Open(sqlite.Open(DBName), &gorm.Config{})
	if err != nil {
		fmt.Printf("Database connection error: %v\n", err)
		panic("failed to connect database")
	}

	fmt.Println("Database connected successfully")

	// 自动迁移模型
	err = DB.AutoMigrate(&models.ClubMember{}, &models.Activity{}, &models.MemberProfile{}, &models.MemoryCode{}, &models.Document{}, &models.DocumentChunk{})
	if err != nil {
		fmt.Printf("Migration error: %v\n", err)
		panic("failed to migrate database")
	}

	fmt.Println("Database migration completed")
}

// GetDB 返回数据库实例
func GetDB() *gorm.DB {
	return DB
}
