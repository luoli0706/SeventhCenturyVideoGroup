package models

import "gorm.io/gorm"

type Activity struct {
	gorm.Model
	Name   string `gorm:"column:name"`
	Time   string `gorm:"column:time"` // 例如 "2024-12-25"
	Detail string `gorm:"column:detail"`
	Image  string `gorm:"column:image"` // 可选图片URL
}
