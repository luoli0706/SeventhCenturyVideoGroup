package controllers

import (
	"crypto/rand"
	"math/big"
	"net/http"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/config"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/models"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
)

// 忘记密码 - 通过备忘码重置密码
func ForgotPassword(c echo.Context) error {
	type ForgotPasswordRequest struct {
		CN         string `json:"cn"`
		MemoryCode string `json:"memory_code"`
	}

	var req ForgotPasswordRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "无效的请求格式"})
	}

	// 验证输入
	if req.CN == "" || req.MemoryCode == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "成员姓名和备忘码不能为空"})
	}

	// 检查用户是否存在
	var member models.ClubMember
	if err := config.DB.Where("cn = ?", req.CN).First(&member).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "用户不存在"})
	}

	// 验证备忘码
	var memoryCode models.MemoryCode
	today := time.Now().Format("2006-01-02")
	if err := config.DB.Where("code = ? AND date = ?", req.MemoryCode, today).First(&memoryCode).Error; err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "备忘码无效或已过期"})
	}

	// 重置密码为 0721
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("0721"), bcrypt.DefaultCost)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "密码重置失败"})
	}

	member.Password = string(hashedPassword)
	if err := config.DB.Save(&member).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "密码重置失败"})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "密码已重置为 0721"})
}

// 修改密码
func ChangePassword(c echo.Context) error {
	type ChangePasswordRequest struct {
		CN          string `json:"cn"`
		OldPassword string `json:"old_password"`
		NewPassword string `json:"new_password"`
	}

	var req ChangePasswordRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "无效的请求格式"})
	}

	// 验证输入
	if req.CN == "" || req.OldPassword == "" || req.NewPassword == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "所有字段都不能为空"})
	}

	// 检查用户是否存在
	var member models.ClubMember
	if err := config.DB.Where("cn = ?", req.CN).First(&member).Error; err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "用户不存在"})
	}

	// 验证当前密码
	if err := bcrypt.CompareHashAndPassword([]byte(member.Password), []byte(req.OldPassword)); err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "当前密码错误"})
	}

	// 加密新密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "密码加密失败"})
	}

	// 更新密码
	member.Password = string(hashedPassword)
	if err := config.DB.Save(&member).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "密码更新失败"})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "密码修改成功"})
}

// 获取今日备忘码
func GetMemoryCode(c echo.Context) error {
	today := time.Now().Format("2006-01-02")

	var memoryCode models.MemoryCode
	err := config.DB.Where("date = ?", today).First(&memoryCode).Error

	if err != nil {
		// 如果今天没有备忘码，生成一个新的
		newCode := generateMemoryCode(today)
		memoryCode = models.MemoryCode{
			Code: newCode,
			Date: today,
		}

		if err := config.DB.Create(&memoryCode).Error; err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "生成备忘码失败"})
		}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"code": memoryCode.Code,
		"date": memoryCode.Date,
	})
}

// 生成当日备忘码。
//
// 必须用 crypto/rand：旧实现以「年月日」作随机种子（rand.Seed），任何人拿到
// 公开源码即可算出当天备忘码，而 /api/forgot-password 无需认证、只认码，
// 两者组合足以接管任意成员的账号。码空间也曾只有 1000-9999。
//
// 调用方每天只生成一次并落库（见 GetMemoryCode），所以当天内依然稳定。
func generateMemoryCode(dateStr string) string {
	const digitCount = 8

	digits := make([]byte, digitCount)
	ten := big.NewInt(10)
	for i := range digits {
		n, err := rand.Int(rand.Reader, ten)
		if err != nil {
			// crypto/rand 不可用时退化为纳秒时间戳，仍然不可预测
			return strconv.FormatInt(time.Now().UnixNano()%100000000, 10)
		}
		digits[i] = byte('0' + n.Int64())
	}

	return string(digits)
}

// 清理过期备忘码（可以在定时任务中调用）
func CleanupExpiredMemoryCodes() {
	// 删除7天前的备忘码
	sevenDaysAgo := time.Now().AddDate(0, 0, -7).Format("2006-01-02")
	config.DB.Where("date < ?", sevenDaysAgo).Delete(&models.MemoryCode{})
}
