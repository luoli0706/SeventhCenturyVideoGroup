package models

import "gorm.io/gorm"

// ClubMember 社团成员模型
type ClubMember struct {
	gorm.Model
	CN        string `gorm:"primaryKey;column:cn"`
	Sex       string `gorm:"column:sex"`
	Position  string `gorm:"column:position"`
	Year      string `gorm:"column:year"`
	Direction string `gorm:"column:direction"`
	Status    string `gorm:"column:status"` // 新增字段：在役状态
	Remark    string `gorm:"column:remark"`
}
