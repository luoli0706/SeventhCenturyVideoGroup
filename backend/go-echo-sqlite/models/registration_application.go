package models

import (
	"time"

	"gorm.io/gorm"
)

// 申请状态取值
const (
	ApplicationPending  = "pending"  // 待审核
	ApplicationApproved = "approved" // 已批准
	ApplicationRejected = "rejected" // 已拒绝
)

// RegistrationApplication 注册申请。审批通过后才会创建 ClubMember。
// 独立成表而不是给 club_members 加状态列：公开的成员名单接口会因此泄露待审人员。
type RegistrationApplication struct {
	gorm.Model
	CN           string     `gorm:"column:cn;index" json:"cn"`
	Password     string     `gorm:"column:password" json:"-"` // bcrypt hash，提交时即加密
	Sex          string     `gorm:"column:sex" json:"sex"`
	Position     string     `gorm:"column:position" json:"position"`
	Year         string     `gorm:"column:year" json:"year"`
	Direction    string     `gorm:"column:direction" json:"direction"`
	Status       string     `gorm:"column:status" json:"status"` // 在役状态
	Remark       string     `gorm:"column:remark" json:"remark"`
	State        string     `gorm:"column:state;index" json:"state"`
	RejectReason string     `gorm:"column:reject_reason" json:"reject_reason"`
	ReviewedBy   string     `gorm:"column:reviewed_by" json:"reviewed_by"`
	ReviewedAt   *time.Time `gorm:"column:reviewed_at" json:"reviewed_at"`
}
