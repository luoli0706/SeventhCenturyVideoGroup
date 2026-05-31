package controllers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
)

const uploadDir = "pics/activities"
const maxFileSize int64 = 30 << 20 // 30MB
const maxFiles = 10

var allowedExt = map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true}

func UploadImage(c echo.Context) error {
	absDir := getUploadDir()
	if err := os.MkdirAll(absDir, 0755); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to create upload directory"})
	}

	// Parse multipart form (up to 300MB to accommodate 10×30MB files)
	if err := c.Request().ParseMultipartForm(300 << 20); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "failed to parse form data"})
	}
	defer c.Request().MultipartForm.RemoveAll()

	// Check both "image" (single) and "images" (multiple) fields
	files := c.Request().MultipartForm.File["images"]
	if len(files) == 0 {
		files = c.Request().MultipartForm.File["image"]
	}
	if len(files) == 0 {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "missing image file"})
	}
	if len(files) > maxFiles {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("too many files, max %d", maxFiles)})
	}

	var urls []string

	for _, file := range files {
		if file.Size > maxFileSize {
			return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("file too large, max 30MB: %s", file.Filename)})
		}

		ext := filepath.Ext(file.Filename)
		if !allowedExt[ext] {
			return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("unsupported file type: %s, allowed: jpg, png, gif, webp", file.Filename)})
		}

		src, err := file.Open()
		if err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"error": fmt.Sprintf("failed to open: %s", file.Filename)})
		}

		filename := fmt.Sprintf("%d_%d%s", time.Now().UnixMilli(), time.Now().UnixNano()%100000, ext)
		dstPath := filepath.Join(absDir, filename)

		dst, err := os.Create(dstPath)
		if err != nil {
			src.Close()
			return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to save file"})
		}

		if _, err := io.Copy(dst, src); err != nil {
			src.Close()
			dst.Close()
			return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to write file"})
		}
		src.Close()
		dst.Close()

		urls = append(urls, fmt.Sprintf("/pics/activities/%s", filename))
	}

	return c.JSON(http.StatusOK, echo.Map{"urls": urls})
}

func getUploadDir() string {
	return filepath.Join(filepath.Dir("."), uploadDir)
}

func DeleteUploadedImage(c echo.Context) error {
	var req struct {
		URL string `json:"url"`
	}
	if err := c.Bind(&req); err != nil || req.URL == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid request"})
	}

	// Prevent path traversal: only allow filename, reject any path components
	filename := filepath.Base(req.URL)
	if filename == "" || filename == "." || filename == ".." {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid filename"})
	}

	fullPath := filepath.Join(getUploadDir(), filename)

	// Verify the file exists and is within the upload directory
	absPath, _ := filepath.Abs(fullPath)
	absDir, _ := filepath.Abs(getUploadDir())
	if !strings.HasPrefix(absPath, absDir) {
		return c.JSON(http.StatusForbidden, echo.Map{"error": "access denied"})
	}

	if err := os.Remove(fullPath); err != nil {
		if os.IsNotExist(err) {
			return c.JSON(http.StatusOK, echo.Map{"message": "already removed"})
		}
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to delete file"})
	}

	return c.JSON(http.StatusOK, echo.Map{"message": "deleted"})
}
