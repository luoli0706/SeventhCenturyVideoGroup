package controllers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/labstack/echo/v4"
)

const uploadDir = "pics/activities"

func UploadImage(c echo.Context) error {
	// Ensure upload directory exists
	absDir := filepath.Join(filepath.Dir("."), uploadDir)
	if err := os.MkdirAll(absDir, 0755); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to create upload directory"})
	}

	file, err := c.FormFile("image")
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "missing image file"})
	}

	// Validate file size (max 10MB)
	if file.Size > 10<<20 {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "file too large, max 10MB"})
	}

	// Validate extension
	ext := filepath.Ext(file.Filename)
	allowed := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true}
	if !allowed[ext] {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "unsupported file type, allowed: jpg, png, gif, webp"})
	}

	src, err := file.Open()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to open uploaded file"})
	}
	defer src.Close()

	// Generate unique filename
	filename := fmt.Sprintf("%d_%d%s", time.Now().UnixMilli(), time.Now().UnixNano()%100000, ext)
	dstPath := filepath.Join(absDir, filename)

	dst, err := os.Create(dstPath)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to save file"})
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to write file"})
	}

	url := fmt.Sprintf("/pics/activities/%s", filename)
	return c.JSON(http.StatusOK, echo.Map{"url": url})
}
