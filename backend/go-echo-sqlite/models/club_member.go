package models

import "gorm.io/gorm"

// ClubMember 社团成员模型
type ClubMember struct {
	gorm.Model
	// uniqueIndex：昵称在库层唯一。注册/审批都靠应用层 SELECT 查重，
	// 并发下存在 TOCTOU 竞态（两个申请同时通过查重、各自建号），
	// 唯一索引把这个竞态变成一次干净的写入失败。用户可见的提示仍由
	// 应用层负责，索引是最后一道兜底。
	CN string `gorm:"primaryKey;column:cn;uniqueIndex:idx_club_members_cn"`
	Password  string `gorm:"column:password" json:"-"` // 密码哈希，绝不外泄
	Sex       string `gorm:"column:sex"`
	Position  string `gorm:"column:position"`
	Year      string `gorm:"column:year"`
	Direction string `gorm:"column:direction"`
	Status    string `gorm:"column:status"`                  // 在役状态
	IsMember  bool   `gorm:"column:is_member;default:true"`  // 是否为社团成员
	IsAdmin   bool   `gorm:"column:is_admin;default:false" json:"-"` // 管理员：可审批注册申请
	Remark    string `gorm:"column:remark"`
}
