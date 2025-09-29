package models

import "gorm.io/gorm"

// MemberProfile 成员个人主页模型
type MemberProfile struct {
	gorm.Model
	CN                 string `gorm:"column:cn;uniqueIndex"`      // 成员姓名，唯一索引
	Avatar             string `gorm:"column:avatar"`              // 头像文件路径
	BiliUID            string `gorm:"column:bili_uid"`            // B站UID
	Signature          string `gorm:"column:signature"`           // 个性签名
	RepresentativeWork string `gorm:"column:representative_work"` // 代表作BV号
	Other              string `gorm:"column:other"`               // 其他信息
}
