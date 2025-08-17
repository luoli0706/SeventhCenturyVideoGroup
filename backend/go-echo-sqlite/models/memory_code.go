package models

import (
	"time"

	"gorm.io/gorm"
)

type MemoryCode struct {
	ID        uint           `json:"id" gorm:"primary_key"`
	Code      string         `json:"code" gorm:"not null"`
	Date      string         `json:"date" gorm:"not null"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}
