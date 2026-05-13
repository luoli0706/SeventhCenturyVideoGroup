package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/labstack/echo/v4"
)

// 限制操作在知识库目录内
const kbRoot = "backend/AI-data-source"

func getKBRoot() string {
	// 从可执行文件所在目录计算相对路径
	exe, _ := os.Executable()
	dir := filepath.Dir(exe)
	root := filepath.Join(dir, kbRoot)
	// fallback: 从工作目录
	if _, err := os.Stat(root); os.IsNotExist(err) {
		wd, _ := os.Getwd()
		root = filepath.Join(wd, kbRoot)
	}
	// fallback: 绝对路径
	if _, err := os.Stat(root); os.IsNotExist(err) {
		root = "/www/wwwroot/scvg/backend/AI-data-source"
	}
	return root
}

// isIndexFile 检查是否为索引文件（禁止手动编辑）
func isIndexFile(path string) bool {
	return filepath.Base(path) == "索引.md"
}

// sanitizePath 确保 path 在 kbRoot 内，防止路径穿越
func sanitizePath(kbRoot, rawPath string) (string, error) {
	clean := filepath.Clean(rawPath)
	// 去掉前导斜杠
	clean = strings.TrimPrefix(clean, "/")
	fullPath := filepath.Join(kbRoot, clean)

	absRoot, _ := filepath.Abs(kbRoot)
	absPath, _ := filepath.Abs(fullPath)

	if !strings.HasPrefix(absPath, absRoot) {
		return "", fmt.Errorf("路径超出知识库范围")
	}
	return absPath, nil
}

type FileNode struct {
	Name     string     `json:"name"`
	Path     string     `json:"path"`
	IsDir    bool       `json:"isDir"`
	Children []FileNode `json:"children,omitempty"`
}

// KBTree 获取知识库文件树
func KBTree(c echo.Context) error {
	root := getKBRoot()
	tree, err := buildTree(root, "")
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": err.Error()})
	}
	return c.JSON(http.StatusOK, tree)
}

func buildTree(root, prefix string) ([]FileNode, error) {
	dir := root
	if prefix != "" {
		dir = filepath.Join(root, prefix)
	}

	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	var nodes []FileNode
	for _, entry := range entries {
		relPath := entry.Name()
		if prefix != "" {
			relPath = prefix + "/" + entry.Name()
		}

		if entry.IsDir() {
			children, err := buildTree(root, relPath)
			if err != nil {
				continue
			}
			nodes = append(nodes, FileNode{
				Name:     entry.Name(),
				Path:     relPath,
				IsDir:    true,
				Children: children,
			})
		} else if strings.HasSuffix(entry.Name(), ".md") {
			nodes = append(nodes, FileNode{
				Name:  entry.Name(),
				Path:  relPath,
				IsDir: false,
			})
		}
	}

	sort.Slice(nodes, func(i, j int) bool {
		if nodes[i].IsDir != nodes[j].IsDir {
			return nodes[i].IsDir // 目录排在前面
		}
		return nodes[i].Name < nodes[j].Name
	})

	return nodes, nil
}

// KBRead 读取知识库文件
func KBRead(c echo.Context) error {
	root := getKBRoot()
	rawPath := c.QueryParam("path")

	fullPath, err := sanitizePath(root, rawPath)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	info, err := os.Stat(fullPath)
	if err != nil {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "文件不存在"})
	}
	if info.IsDir() {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "不能读取目录"})
	}

	data, err := os.ReadFile(fullPath)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "读取失败"})
	}

	relPath, _ := filepath.Rel(root, fullPath)
	return c.JSON(http.StatusOK, echo.Map{
		"path":    relPath,
		"content": string(data),
	})
}

type SaveRequest struct {
	Path    string `json:"path"`
	Content string `json:"content"`
}

// KBSave 保存知识库文件（创建或覆写）
func KBSave(c echo.Context) error {
	var req SaveRequest
	if err := json.NewDecoder(c.Request().Body).Decode(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "请求格式错误"})
	}
	if req.Path == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "path 不能为空"})
	}
	if isIndexFile(req.Path) {
		return c.JSON(http.StatusForbidden, echo.Map{"error": "索引文件由系统自动维护，不可手动编辑"})
	}

	root := getKBRoot()
	fullPath, err := sanitizePath(root, req.Path)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	// 确保父目录存在
	parentDir := filepath.Dir(fullPath)
	if err := os.MkdirAll(parentDir, 0755); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "创建目录失败"})
	}

	if err := os.WriteFile(fullPath, []byte(req.Content), 0644); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "写入失败"})
	}

	relPath, _ := filepath.Rel(root, fullPath)
	return c.JSON(http.StatusOK, echo.Map{
		"path":    relPath,
		"message": "保存成功",
	})
}

type CreateRequest struct {
	ParentPath string `json:"parentPath"`
	Name       string `json:"name"`
	Type       string `json:"type"` // "file" 或 "dir"
}

// KBCreate 创建新文件或目录
func KBCreate(c echo.Context) error {
	var req CreateRequest
	if err := json.NewDecoder(c.Request().Body).Decode(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "请求格式错误"})
	}
	if req.Name == "" || req.Type == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "name 和 type 不能为空"})
	}
	if isIndexFile(req.Name) {
		return c.JSON(http.StatusForbidden, echo.Map{"error": "索引文件由系统自动维护，不可手动创建"})
	}

	root := getKBRoot()
	parentPath, err := sanitizePath(root, req.ParentPath)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	fullPath := filepath.Join(parentPath, req.Name)
	relPath, _ := filepath.Rel(root, fullPath)

	if _, err := os.Stat(fullPath); err == nil {
		return c.JSON(http.StatusConflict, echo.Map{"error": "文件或目录已存在"})
	}

	if req.Type == "dir" {
		if err := os.MkdirAll(fullPath, 0755); err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"error": "创建目录失败"})
		}
		// 为新目录创建索引文件
		idxPath := filepath.Join(fullPath, req.Name+".md")
		idxContent := "# " + req.Name + "\n\n"
		os.WriteFile(idxPath, []byte(idxContent), 0644)
	} else {
		if err := os.WriteFile(fullPath, []byte(""), 0644); err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"error": "创建文件失败"})
		}
	}

	return c.JSON(http.StatusOK, echo.Map{
		"path":    relPath,
		"message": "创建成功",
	})
}

type DeleteRequest struct {
	Path string `json:"path"`
}

// KBDelete 删除文件或空目录
func KBDelete(c echo.Context) error {
	var req DeleteRequest
	if err := json.NewDecoder(c.Request().Body).Decode(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "请求格式错误"})
	}
	if req.Path == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "path 不能为空"})
	}
	if isIndexFile(req.Path) {
		return c.JSON(http.StatusForbidden, echo.Map{"error": "索引文件由系统自动维护，不可删除"})
	}

	root := getKBRoot()
	fullPath, err := sanitizePath(root, req.Path)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
	}

	// 不允许删除根目录
	if fullPath == root {
		return c.JSON(http.StatusForbidden, echo.Map{"error": "不能删除根目录"})
	}

	info, err := os.Stat(fullPath)
	if err != nil {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "文件或目录不存在"})
	}

	if info.IsDir() {
		entries, _ := os.ReadDir(fullPath)
		if len(entries) > 0 {
			return c.JSON(http.StatusBadRequest, echo.Map{"error": "目录非空，请先删除子项"})
		}
		if err := os.Remove(fullPath); err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"error": "删除目录失败"})
		}
	} else {
		if err := os.Remove(fullPath); err != nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{"error": "删除文件失败"})
		}
	}

	relPath, _ := filepath.Rel(root, fullPath)
	return c.JSON(http.StatusOK, echo.Map{
		"path":    relPath,
		"message": "删除成功",
	})
}
