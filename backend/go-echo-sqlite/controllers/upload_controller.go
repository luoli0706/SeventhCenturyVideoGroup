package controllers

import (
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/labstack/echo/v4"
)

const uploadDir = "pics/activities"
const maxFileSize int64 = 20 << 20 // 20MB

var allowedExt = map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true}

func UploadImage(c echo.Context) error {
	// Ensure upload directory exists
	absDir := filepath.Join(filepath.Dir("."), uploadDir)
	if err := os.MkdirAll(absDir, 0755); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to create upload directory"})
	}

	// Accept both single "image" and multiple "images"
	var files []*multipart.FileHeader

	singleFile, err := c.FormFile("image")
	if err == nil {
		// Single file upload
		files = append(files, singleFile)
	} else {
		// Try multiple file upload
		form, err := c.MultipartForm()
		if err != nil {
			return c.JSON(http.StatusBadRequest, echo.Map{"error": "missing image file"})
		}
		files = form.File["images"]
	}

	if len(files) == 0 {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "missing image file"})
	}

	if len(files) > 10 {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "too many files, max 10"})
	}

	var urls []string

	for _, file := range files {
		// Validate file size
		if file.Size > maxFileSize {
			return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("file too large, max 20MB: %s", file.Filename)})
		}

		// Validate extension
		ext := filepath.Ext(file.Filename)
		if !allowedExt[ext] {
			return c.JSON(http.StatusBadRequest, echo.Map{"error": fmt.Sprintf("unsupported file type: %s, allowed: jpg, png, gif, webp", file.Filename)})
		}

		src, err := file.Open()
		if err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"error": fmt.Sprintf("failed to open file: %s", file.Filename)})
		}

		// Generate unique filename
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
