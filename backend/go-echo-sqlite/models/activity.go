package models

import "gorm.io/gorm"

type Activity struct {
	gorm.Model
	Name    string `gorm:"column:name"`
	Time    string `gorm:"column:time"` // 例如 "2024-12-25"
	Content string `gorm:"column:content"`
	Detail  string `gorm:"column:detail"`
}
