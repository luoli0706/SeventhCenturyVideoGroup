package models

import "gorm.io/gorm"

// ClubMember 社团成员模型
type ClubMember struct {
	gorm.Model
	CN       string `gorm:"primaryKey;column:cn"`
	Sex      string `gorm:"column:sex"`
	Position string `gorm:"column:position"`
	Remark   string `gorm:"column:remark"`
}
