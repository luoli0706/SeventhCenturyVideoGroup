package controllers

import (
	"math/rand"
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

// 生成基于日期的四位数备忘码
func generateMemoryCode(dateStr string) string {
	// 解析日期字符串为时间对象
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		// 如果解析失败，使用当前时间
		date = time.Now()
	}

	// 使用日期的年月日作为种子，确保同一天生成相同的备忘码
	year, month, day := date.Date()
	seed := int64(year*10000 + int(month)*100 + day)

	// 设置随机种子
	rand.Seed(seed)

	// 生成1000-9999之间的四位数
	code := rand.Intn(9000) + 1000

	return strconv.Itoa(code)
}

// 清理过期备忘码（可以在定时任务中调用）
func CleanupExpiredMemoryCodes() {
	// 删除7天前的备忘码
	sevenDaysAgo := time.Now().AddDate(0, 0, -7).Format("2006-01-02")
	config.DB.Where("date < ?", sevenDaysAgo).Delete(&models.MemoryCode{})
}
