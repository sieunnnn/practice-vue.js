<template>
  <div class="background">
    <div class="flex-row" style="justify-content: center">
      <div class="flex-col" style="width: 90%;">
        <div class="title" style="font-size: 36px; font-weight: 700; margin-top: 50px">다른 사람들은 어떤 여행을 했을까?</div>
        <div class="title" style="font-size: 24px; font-weight: 300; margin-top: 6px">회원들의 공개 플래너를 모아봤어요.</div>
        <div class="flex-row" style="width: 555px; margin-top: 20px">
          <div class="form-item">
            <div class="align-contents">
              <input id="title" type="text" v-model="formValue.input" placeholder="키워드로 검색할수도 있어요." class="custom-input" />
              <button type="submit" class="blue-button" @click="handleSearch">
                <font-awesome-icon icon="fa-solid fa-magnifying-glass" style="margin-right: 8px"/>
                <span class="label" style="font-size: 14px; font-weight: 400">검색</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="planner-list-container" ref="plannerList">
      <div class="planner-list-box">
        <div v-for="planner in planners" :key="planner.plannerId" class="planner">
          <div class="flex-row" style="justify-content: space-between;">
            <div class="flex-row">
              <n-tag v-if="planner.profileImages.length === 1" size="small" round :bordered="false" style="margin: 2px 10px 0 0">
                <font-awesome-icon icon="fa-solid fa-user" style="margin: 0 2px 0 2px"/>
                1인 여행
              </n-tag>
              <n-tag v-else size="small" round :bordered="false" type="info" style="margin: 2px 10px 0 0">
                <font-awesome-icon icon="fa-solid fa-user" style="margin: 0 2px 0 2px"/>
                그룹 여행
              </n-tag>
              <n-tag v-if="!planner.isPrivate" size="small" round :bordered="false" type="success" style="margin: 2px 10px 0 0">
                <font-awesome-icon icon="fa-regular fa-eye" style="margin: 0 2px 0 2px" />
                공개중
              </n-tag>
              <n-tag v-else size="small" round :bordered="false" style="margin: 2px 10px 0 0">
                <font-awesome-icon icon="fa-regular fa-eye-slash" style="margin: 0 2px 0 2px" />
                비공개
              </n-tag>
            </div>
          </div>
          <div @click="handlePlannerDetail(planner.plannerId)" class="title">{{ planner.title }}</div>
          <div v-if="planner.startDate && planner.endDate" class="flex-row" style="align-items: center">
            <font-awesome-icon v-if="isDatePassed(planner.endDate)" icon="fa-regular fa-calendar-check" class="icon" style="margin: 2px 8px 0 4px; color: #667085; font-size:16px"/>
            <font-awesome-icon v-else icon="fa-regular fa-calendar-check" class="icon" style="margin: 2px 8px 0 4px; color: #F63D68; font-size:16px"/>
            <div class="calendar">{{ planner.startDate }}</div>
            <div class="calendar" style="margin: 0 5px">~</div>
            <div class="calendar">{{ planner.endDate }}</div>
          </div>
          <div class="flex-row" style="justify-content: flex-end; margin-top: 16px">
            <n-avatar-group :options="processedProfileImages(planner.profileImages)" :size="48" :max="4">
              <template #avatar="{ option }">
                <n-avatar :src="option.src"/>
              </template>
              <template #rest="{ options: restOptions, rest }">
                <n-dropdown :options="createDropdownOptions(restOptions)" placement="top">
                  <n-avatar>+{{ rest }}</n-avatar>
                </n-dropdown>
              </template>
            </n-avatar-group>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { getUserPlannerList } from '../../api/PlannerApi.ts';
import { plannerListResponse } from '../../dto/PlannerDto.ts';
import {useUserStore} from "../../store/userStore.ts";
import { useMessage } from "naive-ui";
import router from "@/router";
import {searchPlanners} from "../../api/SearchApi.ts";


const userStore = useUserStore();
const message = useMessage();
const noResults = ref(false);
const formValue = ref({
  input: ''
});

// 클릭 이벤트
const handlePlannerDetail = async (plannerId: number) => {
  await router.push({ path: `/planners/${plannerId}` });
}

// 이미지 처리
const createDropdownOptions = (options: Array<{ src: string }>) =>
    options.map((option) => ({
      key: option.src,
      label: option.src
    }));

const isDatePassed = (endDate: string) => {
  return new Date(endDate) < new Date();
};

const defaultImage = '/default.png';

const processedProfileImages = (images: string[]) => {
  return images.map(img => {
    return { src: img === 'Default' ? defaultImage : img };
  });
};

const handleSearch = async () => {
  const input = formValue.value.input;
  loading.value = true;
  page.value = 0;
  planners.value = [];
  noResults.value = false;

  try {
    const response = await searchPlanners(page.value, size, input);

    if (response.content && response.content.length > 0) {
      planners.value.push(...response.content);
      page.value = response.number + 1;
      totalPages.value = response.totalPages || 1;

    } else {
      noResults.value = true;
      message.error("검색 결과가 존재 하지 않아요. 다른 키워드를 입력해주세요.");
    }

  } catch (error) {
    console.error('Error loading planners:', error);
    message.error("검색 중 오류가 발생했습니다. 다시 시도해주세요.");

  } finally {
    loading.value = false;
  }
}

// 무한 스크롤
const planners = ref<plannerListResponse[]>([]);
const page = ref(0);
const size = 16;
const totalPages = ref(1);
const loading = ref(false);

const loadMorePlanners = async (reset = false) => {
  if (reset) {
    planners.value = [];
    page.value = 0;
    totalPages.value = 1;
  }

  if (loading.value || page.value >= totalPages.value) return;

  console.log('Loading planners...');

  loading.value = true;

  try {
    const response = await getUserPlannerList(page.value, size);
    if (response.content) {
      planners.value.push(...response.content);
      page.value = response.number + 1;
      totalPages.value = response.totalPages || 1;
    }
  } catch (error) {
    console.error('Error loading planners:', error);

  } finally {
    loading.value = false;
  }
};

const handleScroll = () => {
  const container = plannerList.value;
  if (!container) return;

  const scrollTop = container.scrollTop;
  const scrollHeight = container.scrollHeight;
  const clientHeight = container.clientHeight;

  if (scrollTop + clientHeight >= scrollHeight - 50) {
    loadMorePlanners();
  }
};

const plannerList = ref<HTMLElement | null>(null);

onMounted(async () => {
  try {
    await userStore.fetchUserInfo();

    if (userStore.isUserLoggedIn) {
      await loadMorePlanners(true);
      plannerList.value?.addEventListener('scroll', handleScroll);
    }

  } catch (error) {
    console.error('Error loading user information:', error);
  }
});

onBeforeUnmount(() => {
  plannerList.value?.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped lang="scss">
@import '../../assets/scss/color/_black.scss';
@import '../../assets/scss/color/_blue.scss';
@import '../../assets/scss/color/_red.scss';
@import '../../assets/scss/mixins/_background.scss';
@import '../../assets/scss/mixins/_display.scss';
@import '../../assets/scss/mixins/_input.scss';
@import '../../assets/scss/mixins/_button.scss';
@import '../../assets/scss/mixins/_typo.scss';
@import "../../assets/styles/modal.scss";

.flex-row {
  @include flex-row(flex-start, flex-start);
  @include size(100%, auto);
}

.flex-col {
  @include flex-column(flex-start, flex-start);
  @include size(100%, auto);
}

.title {
  @include noto-sans-kr(900, 28px, $black);
  @include size(90%, auto);
  margin: 20px 0 12px 0;
}

.icon {
  @include noto-sans-kr(400, 18px, $gray500);
  margin-top: 5px;

  &:hover {
    cursor: pointer;
  }
}

.calendar {
  @include noto-sans-kr(400, 14px, $gray600);
}

.image {
  @include flex-column(center, center);
  @include size(48px, 48px);
  background-color: $gray300;
  border-radius: 50%;
  margin-left: 10px;
}

.background {
  @include background($gray200);
  @include flex-column(flex-start, flex-start);
  @include size(100vw, 100vh);
}

form {
  @include flex-column(flex-start, flex-start);
  @include size(550px, auto);
}

.form-item {
  @include size(500px, auto);
  @include flex-column(flex-start, flex-start);
  margin-bottom: 16px;

  label {
    @include noto-sans-kr(500, 15px, #1E1E1C);
    margin-bottom: 5px;
  }

  .error {
    @include noto-sans-kr(400, 14px, $red500);
    margin: 4px 0 0 2px;
  }
}

.align-contents {
  @include size(100%, auto);
  @include flex-row(flex-start, flex-start);
  justify-items: center;
}

.custom-input {
  @include custom-input($gray400, $black, $gray400, white, transparent);
  @include size(100%, 32px);
  @include noto-sans-kr(400, 16px, $black);
}

.blue-button {
  @include flex-row(center, center);
  @include custom-button($blue600, $gray25, 5%, 5%, 6px);
  @include noto-sans-kr(400, 14px, $gray25);
  @include size(80px, 32px);
  min-width: 80px;
  vertical-align: center;
  margin-left: 10px;
}

.label {
  @include noto-sans-kr(500, 13px, $gray25);
}

.carousel-img {
  width: 100%;
  height: 300px;
  object-fit: cover;
}

.planner-list-container {
  @include flex-column(flex-start, flex-start);
  padding: 0 5%;
  width: 100%;
  height: 100%;
  overflow: auto;

  &::-webkit-scrollbar {
    display: none;
  }

  -ms-overflow-style: none;
  scrollbar-width: none;
}

.planner-list-box {
  @include flex-row(flex-start, flex-start);
  flex-wrap: wrap;
}

.planner {
  @include flex-column(flex-start, flex-start);
  @include size(380px, auto);
  min-width: 380px;
  padding-inline: 20px;
  padding-block: 20px;
  background-color: $gray25;
  border-radius: 15px;
  margin: 0 20px 20px 0;
  overflow: hidden;
}
</style>
