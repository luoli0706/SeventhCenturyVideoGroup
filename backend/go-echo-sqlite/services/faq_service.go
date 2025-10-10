package services

import (
	"strings"
)

// FAQ represents a frequently asked question and its answer
type FAQ struct {
	Question string
	Answer   string
	Category string
}

// FAQService handles FAQ matching and responses
type FAQService struct {
	faqs []FAQ
}

// NewFAQService creates a new FAQ service
func NewFAQService() *FAQService {
	service := &FAQService{}
	service.initializeFAQs()
	return service
}

// initializeFAQs initializes the FAQ database with content from the knowledge base
func (f *FAQService) initializeFAQs() {
	f.faqs = []FAQ{
		{
			Question: "你是谁？",
			Answer:   "您好！我是柒世纪视频组专属的AI小助手视小姬，专门为MAD/MMD创作研究社团的成员提供支持喵～\n\n根据社团知识库v1.0.0（更新于2025-10-10），我的核心职责是：\n\n我能为您提供：\n- MAD创作的全流程指导（素材选取→剪辑技巧→成品输出）\n- MMD制作的实用建议（模型使用→动作数据→渲染技巧）\n- 基于麦德工坊等专业资源的创作方法论\n- 新手入门路径规划和常见问题解答\n\n如果您正在创作：\n→ MAD方向：我可帮您解析动画素材匹配、节奏卡点、特效运用等关键技巧\n→ MMD方向：我能协助解决模型导入、镜头运镜、物理效果等制作问题\n\n关于视频组，有什么不懂的问题尽管问我，我会结合知识库的专业内容，给您提供切实可行的步骤建议。无论您是刚接触创作还是已有经验，都欢迎一起交流学习，期待在创作道路上陪伴您进步喵！✨\n\n（小提示：提问时说明是MAD还是MMD相关，我能给出更精准的建议哦）",
			Category: "通用",
		},
		{
			Question: "如何保证节奏同步感？",
			Answer:   "先用打点工具（如 Premiere Markers）标记音乐鼓点，再按点对齐关键分镜，适度运用时间重映射配合补帧插件（Twixtor）。这样可以确保视频画面与音乐节拍完美同步，营造出强烈的律动感。",
			Category: "MAD",
		},
		{
			Question: "静止系 MAD 如何避免画面单调？",
			Answer:   "使用景深动画、放大缩小（Ken Burns）、动态图文排版；注意保持镜头运动方向与速度的连贯性。可以通过巧妙的镜头推拉、旋转、缩放来为静态图片增加动感，同时配合文字动画和转场效果。",
			Category: "MAD",
		},
		{
			Question: "参赛作品应准备哪些素材包？",
			Answer:   "成片、无字幕版、分轨音频、项目文件（含素材说明）、制作花絮或 Breakdown（视赛事要求）。完整的素材包能够展示你的创作过程，也便于评委和观众更好地理解你的作品。",
			Category: "MAD",
		},
		{
			Question: "如何为社团比赛挑选合适 BGM？",
			Answer:   "关注赛事主题与情绪要求，预先确认版权是否允许使用；建议选择节奏清晰、有层次感的曲目，方便设计段落过渡。音乐是MAD的灵魂，选择合适的BGM能让作品事半功倍。",
			Category: "通用",
		},
		{
			Question: "MAD 组与 MMD 组会联合项目吗？",
			Answer:   "常规情况下不会。两条线互不干涉，只有在社团管理层另行发布联合公告时才会共享素材或协同发布。这样的分工能让每个组专注于自己的创作领域。",
			Category: "通用",
		},
		{
			Question: "遇到版权下架怎么办？",
			Answer:   "尽量准备无版权音乐版；如因素材投诉被下架，可提交二次创作声明或更换曲目。建议保留多平台备份。版权问题是创作者需要重视的重要话题。",
			Category: "通用",
		},
		{
			Question: "社团内部如何高效共享素材？",
			Answer:   "使用分类清晰的网络盘（音乐/视频/模型/插件）；每份素材附 txt 或 Markdown 说明来源与限制。良好的素材管理能大大提高创作效率。",
			Category: "通用",
		},
		{
			Question: "AI 能提供哪些帮助？",
			Answer:   "快速检索资料、拆解问题、生成学习计划、辅助脚本撰写、整理反馈记录、推荐外部资源。作为你的AI小助手，我随时准备为你的创作之路提供支持！",
			Category: "通用",
		},
		{
			Question: "模型出现 Missing Texture",
			Answer:   "检查贴图路径，使用 PMX Editor 批量重设相对路径。确保所有贴图文件都在正确的位置，并且路径设置正确。",
			Category: "MMD",
		},
		{
			Question: "动作穿模严重",
			Answer:   "微调骨骼、使用补间关键帧缓冲；必要时局部关闭物理 → 手动动画。穿模问题是MMD创作中的常见挑战，需要耐心调整。",
			Category: "MMD",
		},
		{
			Question: "渲染黑屏或崩溃",
			Answer:   "检查显卡驱动、MME 插件是否与当前 MMD 版本兼容；复杂场景可分层渲染再合成。技术问题往往需要逐步排查。",
			Category: "MMD",
		},
		{
			Question: "FPS 过低",
			Answer:   "关闭动态阴影预览、降低抗锯齿级别、隐藏暂时不需要的对象。优化场景设置能有效提升渲染性能。",
			Category: "MMD",
		},
	}
}

// FindExactMatch finds an exact match for the given question
func (f *FAQService) FindExactMatch(question string) *FAQ {
	// Normalize the question for comparison
	normalizedQuestion := f.normalizeQuestion(question)

	for _, faq := range f.faqs {
		normalizedFAQ := f.normalizeQuestion(faq.Question)
		if normalizedFAQ == normalizedQuestion {
			return &faq
		}
	}

	return nil
}

// FindSimilarQuestions finds questions that contain similar keywords
func (f *FAQService) FindSimilarQuestions(question string, limit int) []FAQ {
	var similar []FAQ
	questionWords := f.extractKeywords(question)

	for _, faq := range f.faqs {
		faqWords := f.extractKeywords(faq.Question)
		if f.calculateSimilarity(questionWords, faqWords) > 0.3 {
			similar = append(similar, faq)
		}

		if len(similar) >= limit {
			break
		}
	}

	return similar
}

// normalizeQuestion normalizes a question for comparison
func (f *FAQService) normalizeQuestion(question string) string {
	// Remove punctuation and extra spaces
	question = strings.ReplaceAll(question, "？", "")
	question = strings.ReplaceAll(question, "?", "")
	question = strings.ReplaceAll(question, "！", "")
	question = strings.ReplaceAll(question, "!", "")
	question = strings.ReplaceAll(question, "。", "")
	question = strings.ReplaceAll(question, ".", "")
	question = strings.ReplaceAll(question, "，", "")
	question = strings.ReplaceAll(question, ",", "")
	question = strings.TrimSpace(question)
	question = strings.ToLower(question)

	return question
}

// extractKeywords extracts keywords from a question
func (f *FAQService) extractKeywords(text string) []string {
	// Simple keyword extraction - split by spaces and remove common words
	words := strings.Fields(strings.ToLower(text))
	var keywords []string

	stopWords := map[string]bool{
		"的": true, "是": true, "在": true, "有": true, "和": true, "我": true,
		"你": true, "他": true, "她": true, "它": true, "这": true, "那": true,
		"了": true, "吗": true, "呢": true, "吧": true, "啊": true, "如何": true,
		"怎么": true, "什么": true, "哪里": true, "为什么": true, "怎样": true,
	}

	for _, word := range words {
		if len(word) > 1 && !stopWords[word] {
			keywords = append(keywords, word)
		}
	}

	return keywords
}

// calculateSimilarity calculates similarity between two sets of keywords
func (f *FAQService) calculateSimilarity(words1, words2 []string) float64 {
	if len(words1) == 0 || len(words2) == 0 {
		return 0
	}

	matches := 0
	for _, w1 := range words1 {
		for _, w2 := range words2 {
			if w1 == w2 {
				matches++
				break
			}
		}
	}

	return float64(matches) / float64(len(words1))
}

// GetAllFAQs returns all available FAQs
func (f *FAQService) GetAllFAQs() []FAQ {
	return f.faqs
}
