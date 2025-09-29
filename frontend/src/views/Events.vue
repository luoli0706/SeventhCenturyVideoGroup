package controllers

import (
    "net/http"
    "seventhcenturyvideogroup/backend/go-echo-sqlite/config"
    "seventhcenturyvideogroup/backend/go-echo-sqlite/models"

    "github.com/labstack/echo/v4"
)

func GetActivities(c echo.Context) error {
    var activities []models.Activity
    result := config.DB.Order("time desc").Find(&activities)
    if result.Error != nil {
        return c.JSON(http.StatusInternalServerError, echo.Map{"error": result.Error.Error()})
    }
    return c.JSON(http.StatusOK, activities)
}

func CreateActivity(c echo.Context) error {
    var activity models.Activity
    if err := c.Bind(&activity); err != nil {
        return c.JSON(http.StatusBadRequest, echo.Map{"error": err.Error()})
    }
    result := config.DB.Create(&activity)
    if result.Error != nil {
        return c.JSON(http.StatusInternalServerError, echo.Map{"error": result.Error.Error()})
    }
    return c.JSON(http.StatusCreated, activity)
}<template>
  <div class="events-page">
    <a-card title="社团活动事件">
      <div style="display: flex; justify-content: flex-end; margin-bottom: 12px;">
        <a-select v-model="sortType" style="width: 160px;">
          <a-option value="time">按时间排序</a-option>
          <a-option value="name">按名称排序</a-option>
        </a-select>
      </div>
      <a-scrollbar class="event-scrollbar">
        <div class="event-list">
          <div v-for="event in sortedEvents" :key="event.ID" class="event-block">
            <div class="event-title">{{ event.Name }}</div>
            <div class="event-time">
              {{ formatDate(event.Time) }}
            </div>
            <div class="event-content">{{ event.Content }}</div>
            <router-link :to="`/events/${event.ID}`">
              <a-button type="text">详情页</a-button>
            </router-link>
          </div>
        </div>
      </a-scrollbar>
      <a-space style="margin-top: 24px;">
        <router-link to="/events/upload">
          <a-button type="primary">上传活动</a-button>
        </router-link>
        <a-button @click="goBack">返回上一页</a-button>
      </a-space>
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
function goBack() {
  router.back()
}

const sortType = ref('time')
const events = ref([])

const sortedEvents = computed(() => {
  if (sortType.value === 'name') {
    return [...events.value].sort((a, b) => a.Name.localeCompare(b.Name, 'zh-CN'))
  } else {
    return [...events.value].sort((a, b) => b.Time.localeCompare(a.Time, 'zh-CN'))
  }
})

function formatDate(dateStr) {
  // 直接返回如"2024-12-25"
  return dateStr
}

onMounted(async () => {
  try {
    const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/activities`)
    events.value = res.data
  } catch (e) {
    events.value = []
  }
})
</script>

<style scoped>
.events-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 32px;
}
.event-scrollbar {
  max-height: 400px;
  min-height: 200px;
  width: 100%;
  margin-bottom: 8px;
}
.event-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 0;
  align-items: center;
}
.event-block {
  width: 100%;
  max-width: 520px;
  min-width: 220px;
  box-sizing: border-box;
  padding: 16px;
  border-radius: 8px;
  background: var(--color-bg-2, #f6f6f6);
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.event-block:hover {
  box-shadow: 0 4px 16px rgba(22,93,255,0.08);
}
.event-title {
  font-weight: bold;
  font-size: 1.1em;
}
.event-time {
  color: #888;
  margin: 4px 0;
}
.event-content {
  margin-bottom: 8px;
}
@media (max-width: 600px) {
  .event-block {
    max-width: 98vw;
    min-width: 0;
    padding: 12px;
  }
  .event-scrollbar {
    max-height: 60vw;
    min-height: 120px;
  }
}
</style>