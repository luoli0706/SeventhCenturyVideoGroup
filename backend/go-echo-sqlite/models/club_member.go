package models

import "gorm.io/gorm"

// ClubMember 社团成员模型
type ClubMember struct {
	gorm.Model
	CN        string `gorm:"primaryKey;column:cn"`
	Password  string `gorm:"column:password"` // 新增：密码
	Sex       string `gorm:"column:sex"`
	Position  string `gorm:"column:position"`
	Year      string `gorm:"column:year"`
	Direction string `gorm:"column:direction"`
	Status    string `gorm:"column:status"`                 // 在役状态
	IsMember  bool   `gorm:"column:is_member;default:true"` // 新增：是否为社团成员
	Remark    string `gorm:"column:remark"`
}
