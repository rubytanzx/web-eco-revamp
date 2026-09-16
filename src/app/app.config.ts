import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import {
  provideTablerIcons,
  IconAlertCircle, IconAlertTriangle, IconArrowDown, IconArrowLeft, IconArrowUp,
  IconCalendar, IconCalendarMonth, IconCategory, IconChartBar, IconCheck,
  IconChevronDown, IconChevronLeft, IconChevronRight, IconCopy, IconCpu,
  IconDownload, IconEye, IconEyeOff, IconFileDescription, IconFlag,
  IconFolder, IconInfoCircle, IconLayoutDashboard, IconLayoutGrid,
  IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand,
  IconLock, IconMail, IconMinus, IconPaperclip, IconRefresh,
  IconSearch, IconServer, IconSparkles, IconStarFilled, IconTable,
  IconThumbDown, IconThumbUp, IconTrendingUp, IconUser, IconUserCog,
  IconUsers, IconX, IconMessages,
} from '@tabler/icons-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(),
    provideTablerIcons({
      IconAlertCircle, IconAlertTriangle, IconArrowDown, IconArrowLeft, IconArrowUp,
      IconCalendar, IconCalendarMonth, IconCategory, IconChartBar, IconCheck,
      IconChevronDown, IconChevronLeft, IconChevronRight, IconCopy, IconCpu,
      IconDownload, IconEye, IconEyeOff, IconFileDescription, IconFlag,
      IconFolder, IconInfoCircle, IconLayoutDashboard, IconLayoutGrid,
      IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand,
      IconLock, IconMail, IconMinus, IconPaperclip, IconRefresh,
      IconSearch, IconServer, IconSparkles, IconStarFilled, IconTable,
      IconThumbDown, IconThumbUp, IconTrendingUp, IconUser, IconUserCog,
      IconUsers, IconX, IconMessages,
    }),
  ]
};
