package controllers

import (
	"os"
	"strings"
	"sync"
)

var (
	mcpAdminOnce sync.Once
	mcpAdminSet  map[string]struct{}
)

func loadMCPAdminSet() {
	raw := strings.TrimSpace(os.Getenv("MCP_ADMIN_CNS"))
	if raw == "" {
		raw = "柠白夜,香煎包,猫德oxo,详见包"
	}

	m := make(map[string]struct{})
	for _, part := range strings.Split(raw, ",") {
		cn := strings.TrimSpace(part)
		if cn == "" {
			continue
		}
		m[cn] = struct{}{}
	}
	mcpAdminSet = m
}

func isMCPAdminCN(cn string) bool {
	mcpAdminOnce.Do(loadMCPAdminSet)
	if cn == "" {
		return false
	}
	_, ok := mcpAdminSet[cn]
	return ok
}
