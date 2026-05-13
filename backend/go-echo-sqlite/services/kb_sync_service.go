package services

import (
	"fmt"
	"os"
	"path/filepath"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/config"
	"seventhcenturyvideogroup/backend/go-echo-sqlite/models"
	"strings"
	"time"
)

const kbRootRel = "backend/AI-data-source"
const membersRelDir = "柒世纪视频组成员名单/成员详情"

func getKBRoot() string {
	exe, _ := os.Executable()
	root := filepath.Join(filepath.Dir(exe), kbRootRel)
	if _, err := os.Stat(root); os.IsNotExist(err) {
		wd, _ := os.Getwd()
		root = filepath.Join(wd, kbRootRel)
	}
	if _, err := os.Stat(root); os.IsNotExist(err) {
		root = "/www/wwwroot/scvg/backend/AI-data-source"
	}
	return root
}

func getMemberYearDir(year string, kbRoot string) string {
	return filepath.Join(kbRoot, membersRelDir, year+"年加入")
}

func memberFilePath(cn, year, kbRoot string) string {
	dir := getMemberYearDir(year, kbRoot)
	return filepath.Join(dir, cn+".md")
}

// SyncNewMember creates a KB entry for a newly registered member.
func SyncNewMember(member *models.ClubMember) error {
	root := getKBRoot()

	yearDir := getMemberYearDir(member.Year, root)
	if err := os.MkdirAll(yearDir, 0755); err != nil {
		return fmt.Errorf("创建成员目录失败: %v", err)
	}

	// Ensure the year index file exists
	yearIdxPath := filepath.Join(yearDir, member.Year+"年加入.md")
	if _, err := os.Stat(yearIdxPath); os.IsNotExist(err) {
		os.WriteFile(yearIdxPath, []byte("### "+member.Year+"年加入\n"), 0644)
	}

	filePath := memberFilePath(member.CN, member.Year, root)
	if _, err := os.Stat(filePath); err == nil {
		// File already exists — append a timestamped update instead
		return appendMemberUpdate(filePath, "重新登记", member.Remark, member)
	}

	position := member.Position
	displayName := member.CN
	if position != "" {
		displayName = member.CN + "（" + position + "）"
	}

	var b strings.Builder
	fmt.Fprintf(&b, "#### %s\n", displayName)
	fmt.Fprintf(&b, "- **职位**：%s\n", member.Position)
	fmt.Fprintf(&b, "- **研究方向**：%s\n", member.Direction)
	fmt.Fprintf(&b, "- **加入年份**：%s\n", member.Year)
	fmt.Fprintf(&b, "- **当前状态**：%s\n", member.Status)
	if member.Remark != "" {
		fmt.Fprintf(&b, "- **描述**：%s\n", member.Remark)
	}
	b.WriteString("\n")

	if err := os.WriteFile(filePath, []byte(b.String()), 0644); err != nil {
		return fmt.Errorf("写入成员文件失败: %v", err)
	}

	// Update 索引.md
	if err := updateMemberIndex(member, displayName); err != nil {
		return fmt.Errorf("更新索引失败: %v", err)
	}

	return nil
}

// SyncProfileUpdate appends a timestamped profile update to the member's KB file.
// If the file doesn't exist, it creates one with available info.
func SyncProfileUpdate(cn string, profile *models.MemberProfile) error {
	root := getKBRoot()

	// We need the year — query from the member record
	member, err := getClubMemberByCN(cn)
	if err != nil || member.Year == "" {
		// Can't determine year; fallback: try to find file in any year dir
		return findAndUpdateMemberFile(cn, root, profile)
	}

	filePath := memberFilePath(cn, member.Year, root)

	// Also ensure the full member list markdown entry is updated if needed
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		yearDir := getMemberYearDir(member.Year, root)
		if err := os.MkdirAll(yearDir, 0755); err != nil {
			return fmt.Errorf("创建成员目录失败: %v", err)
		}
		// Create initial file with registration data
		reSyncNewMember(member, filePath)
	}

	return appendMemberUpdate(filePath, "更新资料", "", profile)
}

func getClubMemberByCN(cn string) (*models.ClubMember, error) {
	var member models.ClubMember
	result := config.DB.Where("cn = ?", cn).First(&member)
	if result.Error != nil {
		return nil, result.Error
	}
	return &member, nil
}

func reSyncNewMember(member *models.ClubMember, filePath string) {
	position := member.Position
	displayName := member.CN
	if position != "" {
		displayName = member.CN + "（" + position + "）"
	}

	var b strings.Builder
	fmt.Fprintf(&b, "#### %s\n", displayName)
	fmt.Fprintf(&b, "- **职位**：%s\n", member.Position)
	fmt.Fprintf(&b, "- **研究方向**：%s\n", member.Direction)
	fmt.Fprintf(&b, "- **加入年份**：%s\n", member.Year)
	fmt.Fprintf(&b, "- **当前状态**：%s\n", member.Status)
	if member.Remark != "" {
		fmt.Fprintf(&b, "- **描述**：%s\n", member.Remark)
	}
	b.WriteString("\n")

	os.WriteFile(filePath, []byte(b.String()), 0644)
}

func appendMemberUpdate(filePath, action string, remark string, data interface{}) error {
	ts := time.Now().Format("2006-01-02 15:04:05")

	var b strings.Builder
	fmt.Fprintf(&b, "\n---\n\n> **更新历史**\n>\n> 更新于 %s\n", ts)

	switch v := data.(type) {
	case *models.MemberProfile:
		if v.Signature != "" {
			fmt.Fprintf(&b, "> - **个性签名**：%s\n", v.Signature)
		}
		if v.BiliUID != "" {
			fmt.Fprintf(&b, "> - **B站UID**：%s\n", v.BiliUID)
		}
		if v.RepresentativeWork != "" {
			fmt.Fprintf(&b, "> - **代表作**：%s\n", v.RepresentativeWork)
		}
		if v.Other != "" {
			fmt.Fprintf(&b, "> - **其他**：%s\n", v.Other)
		}
	case *models.ClubMember:
		if action != "" {
			fmt.Fprintf(&b, "> - **操作**：%s\n", action)
		}
		if remark != "" {
			fmt.Fprintf(&b, "> - **备注**：%s\n", remark)
		}
	}

	b.WriteString("\n")

	f, err := os.OpenFile(filePath, os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		return fmt.Errorf("打开成员文件失败: %v", err)
	}
	defer f.Close()

	if _, err := f.WriteString(b.String()); err != nil {
		return fmt.Errorf("追加成员更新失败: %v", err)
	}
	return nil
}

func findAndUpdateMemberFile(cn, root string, profile *models.MemberProfile) error {
	// Scan all year directories for the member file
	baseDir := filepath.Join(root, membersRelDir)
	entries, err := os.ReadDir(baseDir)
	if err != nil {
		// Last resort: write to a fallback directory
		fallbackDir := filepath.Join(baseDir, "其他")
		os.MkdirAll(fallbackDir, 0755)
		fp := filepath.Join(fallbackDir, cn+".md")
		return appendMemberUpdate(fp, "更新资料", "", profile)
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		dirPath := filepath.Join(baseDir, entry.Name())
		candidatePath := filepath.Join(dirPath, cn+".md")
		if _, err := os.Stat(candidatePath); err == nil {
			return appendMemberUpdate(candidatePath, "更新资料", "", profile)
		}
	}

	// Not found in any year dir — create in fallback
	fallbackDir := filepath.Join(baseDir, "其他")
	os.MkdirAll(fallbackDir, 0755)
	fp := filepath.Join(fallbackDir, cn+".md")
	var b strings.Builder
	fmt.Fprintf(&b, "#### %s\n", cn)
	if profile.Signature != "" {
		fmt.Fprintf(&b, "- **个性签名**：%s\n", profile.Signature)
	}
	if profile.BiliUID != "" {
		fmt.Fprintf(&b, "- **B站UID**：%s\n", profile.BiliUID)
	}
	if profile.RepresentativeWork != "" {
		fmt.Fprintf(&b, "- **代表作**：%s\n", profile.RepresentativeWork)
	}
	if profile.Other != "" {
		fmt.Fprintf(&b, "- **其他**：%s\n", profile.Other)
	}
	b.WriteString("\n")
	os.WriteFile(fp, []byte(b.String()), 0644)
	return nil
}

// updateMemberIndex adds or updates the member entry in 索引.md.
func updateMemberIndex(member *models.ClubMember, displayName string) error {
	root := getKBRoot()
	indexPath := filepath.Join(root, "索引.md")

	data, err := os.ReadFile(indexPath)
	if err != nil {
		return fmt.Errorf("读取索引文件失败: %v", err)
	}

	lines := strings.Split(string(data), "\n")
	yearHeading := "### " + member.Year + "年加入"
	memberEntry := "#### " + displayName
	detailSection := "## 成员详情"

	// Find the member-detail section
	detailIdx := -1
	for i, line := range lines {
		if strings.TrimSpace(line) == detailSection {
			detailIdx = i
			break
		}
	}
	if detailIdx == -1 {
		return fmt.Errorf("未找到成员详情章节")
	}

	// Look for year heading within the member-detail section
	yearIdx := -1
	inDetail := false
	for i, line := range lines {
		if i == detailIdx {
			inDetail = true
			continue
		}
		if !inDetail {
			continue
		}
		trimmed := strings.TrimSpace(line)
		// Stop if we hit another ## heading (next major section)
		if strings.HasPrefix(trimmed, "## ") && trimmed != yearHeading && !strings.HasPrefix(trimmed, "### ") {
			break
		}
		if trimmed == yearHeading {
			yearIdx = i
			break
		}
		// Stop if we hit a higher-level heading
		if strings.HasPrefix(trimmed, "# ") {
			break
		}
	}

	if yearIdx == -1 {
		// Year section doesn't exist — create it after the last ### under 成员详情
		// or at the end of detail section
		insertAt := detailIdx + 1
		for i := detailIdx + 1; i < len(lines); i++ {
			trimmed := strings.TrimSpace(lines[i])
			if strings.HasPrefix(trimmed, "## ") {
				break
			}
			insertAt = i + 1
		}

		newLines := make([]string, 0, len(lines)+3)
		newLines = append(newLines, lines[:insertAt]...)
		newLines = append(newLines, "", yearHeading, memberEntry, "")
		newLines = append(newLines, lines[insertAt:]...)
		output := strings.Join(newLines, "\n")
		return os.WriteFile(indexPath, []byte(output), 0644)
	}

	// Year section exists — check if member entry already present
	entryExists := false
	for i := yearIdx + 1; i < len(lines); i++ {
		trimmed := strings.TrimSpace(lines[i])
		if strings.HasPrefix(trimmed, "#### ") {
			if trimmed == memberEntry {
				entryExists = true
				break
			}
		} else if strings.HasPrefix(trimmed, "### ") || strings.HasPrefix(trimmed, "## ") {
			break
		}
	}

	if entryExists {
		return nil // Already indexed
	}

	// Find insertion point: after the last #### under this year, before next ### or ##
	insertAt := yearIdx + 1
	for i := yearIdx + 1; i < len(lines); i++ {
		trimmed := strings.TrimSpace(lines[i])
		if strings.HasPrefix(trimmed, "### ") || strings.HasPrefix(trimmed, "## ") {
			break
		}
		insertAt = i + 1
	}

	newLines := make([]string, 0, len(lines)+1)
	newLines = append(newLines, lines[:insertAt]...)
	newLines = append(newLines, memberEntry)
	newLines = append(newLines, lines[insertAt:]...)
	output := strings.Join(newLines, "\n")
	return os.WriteFile(indexPath, []byte(output), 0644)
}

