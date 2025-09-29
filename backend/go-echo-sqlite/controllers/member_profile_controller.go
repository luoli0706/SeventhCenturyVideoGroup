package controllers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/config"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/models"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
)

// 确保pics目录存在
func ensurePicsDirectory() error {
	picsDir := "pics"
	if _, err := os.Stat(picsDir); os.IsNotExist(err) {
		return os.MkdirAll(picsDir, 0755)
	}
	return nil
}

// 处理头像上传
func handleAvatarUpload(c echo.Context, cn string) (string, error) {
	// 打印请求信息用于调试
	fmt.Printf("Content-Type: %s\n", c.Request().Header.Get("Content-Type"))

	// 获取上传的文件
	file, err := c.FormFile("avatar")
	if err != nil {
		// 如果没有上传文件，返回空字符串（不是错误）
		fmt.Printf("没有检测到avatar文件字段，错误: %v\n", err)
		return "", nil
	}

	fmt.Printf("检测到文件: %s, 大小: %d\n", file.Filename, file.Size)

	// 检查文件类型
	allowedTypes := []string{".jpg", ".jpeg", ".png", ".gif", ".webp"}
	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowed := false
	for _, allowedType := range allowedTypes {
		if ext == allowedType {
			allowed = true
			break
		}
	}
	if !allowed {
		return "", fmt.Errorf("不支持的文件类型: %s", ext)
	}

	// 确保pics目录存在
	if err := ensurePicsDirectory(); err != nil {
		return "", fmt.Errorf("创建pics目录失败: %v", err)
	}

	// 生成唯一的文件名
	timestamp := time.Now().Unix()
	filename := fmt.Sprintf("%s_%d%s", cn, timestamp, ext)
	filePath := filepath.Join("pics", filename)

	// 打开上传的文件
	src, err := file.Open()
	if err != nil {
		return "", fmt.Errorf("打开上传文件失败: %v", err)
	}
	defer src.Close()

	// 创建目标文件
	dst, err := os.Create(filePath)
	if err != nil {
		return "", fmt.Errorf("创建目标文件失败: %v", err)
	}
	defer dst.Close()

	// 复制文件内容
	if _, err = io.Copy(dst, src); err != nil {
		return "", fmt.Errorf("保存文件失败: %v", err)
	}

	return filePath, nil
}

// GetMemberProfile 获取成员个人主页信息
func GetMemberProfile(c echo.Context) error {
	cn := c.Param("cn")
	if cn == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "成员姓名不能为空"})
	}

	var profile models.MemberProfile
	result := config.DB.Where("cn = ?", cn).First(&profile)
	if result.Error != nil {
		// 如果没找到个人主页，返回404
		return c.JSON(http.StatusNotFound, echo.Map{"error": "未找到该成员的个人主页"})
	}

	return c.JSON(http.StatusOK, profile)
}

// CreateOrUpdateMemberProfile 创建或更新成员个人主页
func CreateOrUpdateMemberProfile(c echo.Context) error {
	cn := c.Param("cn")
	if cn == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "成员姓名不能为空"})
	}

	// 解析multipart表单
	err := c.Request().ParseMultipartForm(32 << 20) // 32MB max
	if err != nil {
		fmt.Printf("解析multipart表单失败: %v\n", err)
	}

	// 打印所有表单字段用于调试
	fmt.Printf("所有表单字段:\n")
	if c.Request().MultipartForm != nil {
		for key, values := range c.Request().MultipartForm.Value {
			fmt.Printf("  %s: %v\n", key, values)
		}
		fmt.Printf("文件字段:\n")
		for key, files := range c.Request().MultipartForm.File {
			fmt.Printf("  %s: %d个文件\n", key, len(files))
			for i, file := range files {
				fmt.Printf("    文件%d: %s (大小: %d)\n", i, file.Filename, file.Size)
			}
		}
	}

	// 处理头像上传
	avatarPath, err := handleAvatarUpload(c, cn)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("头像上传失败: %v", err)})
	}

	// 调试信息：打印头像路径
	fmt.Printf("头像路径: %s\n", avatarPath)

	// 从表单获取其他字段
	profile := models.MemberProfile{
		CN:                 cn,
		BiliUID:            c.FormValue("biliUID"),
		Signature:          c.FormValue("signature"),
		RepresentativeWork: c.FormValue("representativeWork"),
		Other:              c.FormValue("other"),
	}

	// 检查是否已存在该成员的个人主页
	var existingProfile models.MemberProfile
	result := config.DB.Where("cn = ?", cn).First(&existingProfile)

	if result.Error != nil {
		// 不存在，创建新的
		if avatarPath != "" {
			fmt.Printf("创建模式：头像路径: %s\n", avatarPath)
			profile.Avatar = avatarPath
		} else {
			fmt.Printf("创建模式：没有头像\n")
		}
		createResult := config.DB.Create(&profile)
		if createResult.Error != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"error": createResult.Error.Error()})
		}
		fmt.Printf("创建成功，最终profile: %+v\n", profile)
		return c.JSON(http.StatusCreated, profile)
	} else {
		// 已存在，更新
		profile.ID = existingProfile.ID

		// 如果上传了新头像，删除旧头像文件
		if avatarPath != "" {
			fmt.Printf("更新模式：新头像路径: %s\n", avatarPath)
			if existingProfile.Avatar != "" {
				if err := os.Remove(existingProfile.Avatar); err != nil {
					// 记录错误但不影响更新操作
					fmt.Printf("删除旧头像文件失败: %v\n", err)
				}
			}
			profile.Avatar = avatarPath
		} else {
			fmt.Printf("更新模式：没有上传新头像，保留原有头像: %s\n", existingProfile.Avatar)
			// 如果没有上传新头像，保留原有头像
			profile.Avatar = existingProfile.Avatar
		}

		updateResult := config.DB.Save(&profile)
		if updateResult.Error != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"error": updateResult.Error.Error()})
		}
		fmt.Printf("更新成功，最终profile: %+v\n", profile)
		return c.JSON(http.StatusOK, profile)
	}
}

// DeleteMemberProfile 删除成员个人主页
func DeleteMemberProfile(c echo.Context) error {
	cn := c.Param("cn")
	if cn == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "成员姓名不能为空"})
	}

	// 先获取要删除的个人主页信息，以便删除头像文件
	var profile models.MemberProfile
	findResult := config.DB.Where("cn = ?", cn).First(&profile)
	if findResult.Error != nil {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "未找到该成员的个人主页"})
	}

	// 删除数据库记录
	result := config.DB.Where("cn = ?", cn).Delete(&models.MemberProfile{})
	if result.Error != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": result.Error.Error()})
	}

	// 删除头像文件
	if profile.Avatar != "" {
		if err := os.Remove(profile.Avatar); err != nil {
			// 记录错误但不影响删除操作
			fmt.Printf("删除头像文件失败: %v\n", err)
		}
	}

	return c.NoContent(http.StatusNoContent)
}

// CheckMemberProfileExists 检查成员个人主页是否存在
func CheckMemberProfileExists(c echo.Context) error {
	cn := c.Param("cn")
	if cn == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "成员姓名不能为空"})
	}

	var count int64
	config.DB.Model(&models.MemberProfile{}).Where("cn = ?", cn).Count(&count)

	return c.JSON(http.StatusOK, echo.Map{
		"exists": count > 0,
		"cn":     cn,
	})
}
