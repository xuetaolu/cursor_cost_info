import * as https from 'https';

/**
 * Teams API 响应类型定义
 */
export interface Team {
    name: string;
    id: number;
    role: string;
    seats: number;
    hasBilling: boolean;
    subscriptionStatus: string;
    membershipType: string;
    billingCycleStart: string;
    billingCycleEnd: string;
}

export interface TeamsResponse {
    teams: Team[];
}

/**
 * 用户信息 API 响应类型定义
 */
export interface MeResponse {
    email: string;
    email_verified: boolean;
    name: string;
    sub: string;
    created_at: string;
    updated_at: string;
    picture: string | null;
    id: number;
}

/**
 * 使用事件类型定义
 */
export interface UsageEvent {
    timestamp: string;
    model: string;
    kind: string;
    maxMode?: boolean;
    requestsCosts?: number;
    usageBasedCosts?: string;
    isTokenBasedCall?: boolean;
    tokenUsage?: {
        inputTokens?: number;
        outputTokens?: number;
        cacheWriteTokens?: number;
        cacheReadTokens?: number;
        totalCents?: number;
    };
    owningUser: string;
    owningTeam: string;
    cursorTokenFee?: number;
    isChargeable?: boolean;
}

/**
 * 使用事件 API 响应类型定义
 */
export interface UsageEventsResponse {
    totalUsageEventsCount: number;
    usageEventsDisplay: UsageEvent[];
}

/**
 * API 响应数据类型定义
 */
export interface UsageSummary {
    billingCycleStart: string;
    billingCycleEnd: string;
    membershipType: string;
    limitType: string;
    isUnlimited: boolean;
    autoModelSelectedDisplayMessage: string;
    namedModelSelectedDisplayMessage: string;
    individualUsage: {
        plan: {
            enabled: boolean;
            used: number;
            limit: number;
            remaining: number;
            breakdown: {
                included: number;
                bonus: number;
                total: number;
            };
            autoSpend: number;
            apiSpend: number;
            autoLimit: number;
            apiLimit: number;
        };
        onDemand: {
            enabled: boolean;
            used: number;
            limit: number | null;
            remaining: number | null;
        };
    };
    teamUsage: {
        onDemand: {
            enabled: boolean;
            used: number;
            limit: number | null;
            remaining: number | null;
        };
    };
}

/**
 * 调用 Cursor API 获取使用情况摘要
 * @param cookie Cookie 字符串
 * @returns 使用情况摘要数据
 */
export async function fetchUsageSummary(cookie: string): Promise<UsageSummary> {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'cursor.com',
            port: 443,
            path: '/api/usage-summary',
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:145.0) Gecko/20100101 Firefox/145.0',
                'Accept': '*/*',
                'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': 'https://cursor.com/cn/dashboard?tab=usage',
                'Cookie': cookie,
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'Connection': 'keep-alive',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        };

        const req = https.request(options, (res: any) => {
            let data = '';

            // 处理 gzip 压缩
            const encoding = res.headers['content-encoding'];
            let stream: any = res;

            if (encoding === 'gzip' || encoding === 'deflate' || encoding === 'br') {
                const zlib = require('zlib');
                if (encoding === 'gzip') {
                    stream = res.pipe(zlib.createGunzip());
                } else if (encoding === 'deflate') {
                    stream = res.pipe(zlib.createInflate());
                } else if (encoding === 'br') {
                    stream = res.pipe(zlib.createBrotliDecompress());
                }
            }

            stream.on('data', (chunk: any) => {
                data += chunk;
            });

            stream.on('end', () => {
                try {
                    if (res.statusCode !== 200) {
                        reject(new Error(`API 请求失败，状态码: ${res.statusCode}`));
                        return;
                    }

                    const json = JSON.parse(data);
                    resolve(json);
                } catch (error) {
                    reject(new Error(`解析响应失败: ${error}`));
                }
            });
        });

        req.on('error', (error: any) => {
            reject(new Error(`网络请求失败: ${error.message}`));
        });

        req.end();
    });
}

/**
 * 格式化美元金额
 * @param amount 金额（美元）
 * @returns 格式化后的字符串，如 "$123.45"
 */
export function formatCurrency(amount: number): string {
    amount = amount / 100.0;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

/**
 * 计算总使用情况和限额
 * @param summary 使用情况摘要
 * @param customOnDemandLimit 自定义 onDemand 限额（美元），如果为 null 则使用 API 返回的值
 * @returns 总使用情况数据
 */
export interface TotalUsage {
    totalUsed: number;      // plan.used + onDemand.used
    totalLimit: number;     // plan.limit + onDemandLimit
    totalRemaining: number; // totalLimit - totalUsed
    percentage: number;     // (totalUsed / totalLimit) * 100
    planUsed: number;
    planLimit: number;
    onDemandUsed: number;
    onDemandLimit: number;
}

export function calculateTotalUsage(summary: UsageSummary, customOnDemandLimit: number | null): TotalUsage {
    const plan = summary.individualUsage.plan;
    const onDemand = summary.individualUsage.onDemand;

    // 使用自定义限制或 API 返回的限制
    // 注意：customOnDemandLimit 是用户配置的美元值，需要转换为美分（乘以 100）
    // API 返回的 onDemand.limit 已经是美分单位
    const onDemandLimit = customOnDemandLimit !== null
        ? customOnDemandLimit * 100  // 美元转换为美分
        : (onDemand.limit !== null ? onDemand.limit : 0);

    const totalUsed = plan.used + onDemand.used;
    const totalLimit = plan.limit + onDemandLimit;
    const totalRemaining = (totalLimit - totalUsed);
    const percentage = totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0;

    return {
        totalUsed,
        totalLimit,
        totalRemaining,
        percentage,
        planUsed: plan.used,
        planLimit: plan.limit,
        onDemandUsed: onDemand.used,
        onDemandLimit
    };
}

/**
 * 根据使用百分比获取颜色
 * @param percentage 使用百分比 (0-100)
 * @returns 颜色字符串（VS Code 主题颜色或十六进制）
 */
export function getUsageColor(percentage: number): string {
    if (percentage < 50) {
        return '#4EC9B0'; // 绿色 - 使用率低
    } else if (percentage < 80) {
        return '#DCDCAA'; // 黄色 - 使用率中等
    } else if (percentage < 90) {
        return '#CE9178'; // 橙色 - 使用率较高
    } else {
        return '#F48771'; // 红色 - 使用率很高
    }
}

/**
 * 根据使用百分比获取对应的小球 emoji
 * @param percentage 使用百分比 (0-100)
 * @returns 小球 emoji 字符串
 */
export function getUsageIndicator(percentage: number): string {
    if (percentage < 50) {
        return '🟢'; // 绿色 - 使用率低
    } else if (percentage < 80) {
        return '🟡'; // 黄色 - 使用率中等
    } else if (percentage < 90) {
        return '🟠'; // 橙色 - 使用率较高
    } else {
        return '🔴'; // 红色 - 使用率很高
    }
}

/**
 * 生成文本进度条（保留用于向后兼容）
 * @param percentage 使用百分比 (0-100)
 * @param length 进度条长度（字符数），默认 10
 * @returns 文本进度条字符串
 */
export function generateProgressBar(percentage: number, length: number = 10): string {
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * 格式化使用情况为显示文本
 * @param summary 使用情况摘要
 * @param customOnDemandLimit 自定义 onDemand 限额
 * @param showProgressBar 是否显示进度条，默认 true（现在使用小球代替）
 * @returns 格式化后的文本
 */
export function formatUsageDisplay(
    summary: UsageSummary,
    customOnDemandLimit: number | null = null,
    showProgressBar: boolean = true
): string {
    const total = calculateTotalUsage(summary, customOnDemandLimit);
    const usedStr = formatCurrency(total.totalUsed);
    const limitStr = formatCurrency(total.totalLimit);

    if (showProgressBar) {
        // 使用小球指示器代替进度条
        const indicator = getUsageIndicator(total.percentage);
        return `${indicator} ${total.percentage}% | ${usedStr}/${limitStr}`;
    } else {
        return `Cursor: ${usedStr}/${limitStr} (${total.percentage}%)`;
    }
}

/**
 * 获取简短的使用情况文本
 * @param summary 使用情况摘要
 * @param customOnDemandLimit 自定义 onDemand 限额
 * @returns 简短文本
 */
export function getShortUsageText(summary: UsageSummary, customOnDemandLimit: number | null = null): string {
    const total = calculateTotalUsage(summary, customOnDemandLimit);
    const usedStr = formatCurrency(total.totalUsed);
    const limitStr = formatCurrency(total.totalLimit);
    return `$(pulse) ${usedStr}/${limitStr}`;
}

/**
 * 调用 Cursor API 获取详细使用事件
 * @param cookie Cookie 字符串
 * @param teamId Team ID
 * @param userId User ID
 * @param startDate 开始日期（毫秒时间戳字符串）
 * @param endDate 结束日期（毫秒时间戳字符串）
 * @param page 页码
 * @param pageSize 每页数量
 * @returns 使用事件响应
 */
export async function fetchUsageEvents(
    cookie: string,
    teamId: string,
    userId: string,
    startDate: string,
    endDate: string,
    page: number = 1,
    pageSize: number = 500
): Promise<UsageEventsResponse> {
    return new Promise((resolve, reject) => {
        const requestBody = JSON.stringify({
            teamId: parseInt(teamId),
            startDate: startDate,
            endDate: endDate,
            userId: parseInt(userId),
            page: page,
            pageSize: pageSize
        });

        const options = {
            hostname: 'cursor.com',
            port: 443,
            path: '/api/dashboard/get-filtered-usage-events',
            method: 'POST',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Language': 'zh-CN,zh;q=0.9,zh-TW;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Content-Type': 'application/json',
                'Origin': 'https://cursor.com',
                'Referer': 'https://cursor.com/cn/dashboard?tab=usage',
                'Cookie': cookie,
                'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
                'sec-ch-ua-arch': '"x86"',
                'sec-ch-ua-bitness': '"64"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-ch-ua-platform-version': '"10.0.0"',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'priority': 'u=1, i',
                'Connection': 'keep-alive',
                'Content-Length': Buffer.byteLength(requestBody)
            }
        };

        const req = https.request(options, (res: any) => {
            let data = '';

            // 处理压缩
            const encoding = res.headers['content-encoding'];
            let stream: any = res;

            if (encoding === 'gzip' || encoding === 'deflate' || encoding === 'br') {
                const zlib = require('zlib');
                if (encoding === 'gzip') {
                    stream = res.pipe(zlib.createGunzip());
                } else if (encoding === 'deflate') {
                    stream = res.pipe(zlib.createInflate());
                } else if (encoding === 'br') {
                    stream = res.pipe(zlib.createBrotliDecompress());
                }
            }

            stream.on('data', (chunk: any) => {
                data += chunk;
            });

            stream.on('end', () => {
                try {
                    if (res.statusCode !== 200) {
                        reject(new Error(`API 请求失败，状态码: ${res.statusCode}`));
                        return;
                    }

                    const json = JSON.parse(data);
                    resolve(json);
                } catch (error) {
                    reject(new Error(`解析响应失败: ${error}`));
                }
            });
        });

        req.on('error', (error: any) => {
            reject(new Error(`网络请求失败: ${error.message}`));
        });

        req.write(requestBody);
        req.end();
    });
}

/**
 * 获取所有使用事件（自动分页，获取 30 天内的数据）
 * @param cookie Cookie 字符串
 * @param teamId Team ID
 * @param userId User ID
 * @param billingCycleStart 计费周期开始时间（ISO 字符串），用于确定开始日期
 * @returns 所有使用事件数组
 */
export async function fetchAllUsageEvents(
    cookie: string,
    teamId: string,
    userId: string,
    billingCycleStart: string
): Promise<UsageEvent[]> {
    const allEvents: UsageEvent[] = [];
    let page = 1;
    const pageSize = 500;
    let totalCount = 0;

    // 使用 billingCycleStart 作为开始日期，当前时间作为结束日期
    const startDate = new Date(billingCycleStart).getTime().toString();
    const endDate = Date.now().toString();

    do {
        const response = await fetchUsageEvents(cookie, teamId, userId, startDate, endDate, page, pageSize);
        // 当使用周期重置后没有任何使用记录时，usageEventsDisplay 可能是 undefined
        if (response.usageEventsDisplay && response.usageEventsDisplay.length > 0) {
            allEvents.push(...response.usageEventsDisplay);
        }
        totalCount = response.totalUsageEventsCount || 0;
        page++;
    } while (allEvents.length < totalCount);

    return allEvents;
}

/**
 * 计算实际使用成本
 * @param events 使用事件数组
 * @param billingCycleStart 计费周期开始时间（ISO 字符串）
 * @returns 实际使用成本（美元）
 */
export function calculateActualCost(events: UsageEvent[], billingCycleStart: string): number {
    const cycleStartMs = new Date(billingCycleStart).getTime();

    let totalCents = 0;

    for (const event of events) {
        // 过滤掉免费额度和出错未收费的事件
        if (event.kind === 'USAGE_EVENT_KIND_FREE_CREDIT' ||
            event.kind === 'USAGE_EVENT_KIND_ERRORED_NOT_CHARGED') {
            continue;
        }

        // 检查事件是否在计费周期内
        const eventTimestamp = parseInt(event.timestamp);
        if (eventTimestamp < cycleStartMs) {
            continue;
        }

        // 累加 tokenUsage.totalCents（美分单位）
        if (event.tokenUsage?.totalCents !== undefined && event.tokenUsage.totalCents > 0) {
            totalCents += event.tokenUsage.totalCents;
        }

        // 累加 cursorTokenFee（美分单位）
        // CSV 的 Cost = tokenUsage.totalCents + cursorTokenFee
        if (event.cursorTokenFee !== undefined && event.cursorTokenFee > 0) {
            totalCents += event.cursorTokenFee;
        }
    }

    // 转换为美元
    return totalCents / 100;
}

/**
 * 格式化实际成本为美元字符串
 * @param cost 成本（美元）
 * @returns 格式化后的字符串，如 "$123.45"
 */
export function formatActualCost(cost: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(cost);
}

/**
 * 获取当前用户信息
 * @param cookie Cookie 字符串
 * @returns 用户信息
 */
export async function fetchMe(cookie: string): Promise<MeResponse> {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'cursor.com',
            port: 443,
            path: '/api/auth/me',
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Language': 'zh-CN,zh;q=0.9,zh-TW;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': 'https://cursor.com/cn/dashboard?tab=usage',
                'Cookie': cookie,
                'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
                'sec-ch-ua-arch': '"x86"',
                'sec-ch-ua-bitness': '"64"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-ch-ua-platform-version': '"10.0.0"',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'priority': 'u=1, i',
                'Connection': 'keep-alive'
            }
        };

        const req = https.request(options, (res: any) => {
            let data = '';

            const encoding = res.headers['content-encoding'];
            let stream: any = res;

            if (encoding === 'gzip' || encoding === 'deflate' || encoding === 'br') {
                const zlib = require('zlib');
                if (encoding === 'gzip') {
                    stream = res.pipe(zlib.createGunzip());
                } else if (encoding === 'deflate') {
                    stream = res.pipe(zlib.createInflate());
                } else if (encoding === 'br') {
                    stream = res.pipe(zlib.createBrotliDecompress());
                }
            }

            stream.on('data', (chunk: any) => {
                data += chunk;
            });

            stream.on('end', () => {
                try {
                    if (res.statusCode !== 200) {
                        reject(new Error(`获取用户信息失败，状态码: ${res.statusCode}`));
                        return;
                    }

                    const json = JSON.parse(data);
                    resolve(json);
                } catch (error) {
                    reject(new Error(`解析用户信息失败: ${error}`));
                }
            });
        });

        req.on('error', (error: any) => {
            reject(new Error(`获取用户信息网络请求失败: ${error.message}`));
        });

        req.end();
    });
}

/**
 * 获取用户团队列表
 * @param cookie Cookie 字符串
 * @returns 团队列表响应
 */
export async function fetchTeams(cookie: string): Promise<TeamsResponse> {
    return new Promise((resolve, reject) => {
        const requestBody = '{}';

        const options = {
            hostname: 'cursor.com',
            port: 443,
            path: '/api/dashboard/teams',
            method: 'POST',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Language': 'zh-CN,zh;q=0.9,zh-TW;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Content-Type': 'application/json',
                'Origin': 'https://cursor.com',
                'Referer': 'https://cursor.com/cn/dashboard?tab=usage',
                'Cookie': cookie,
                'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
                'sec-ch-ua-arch': '"x86"',
                'sec-ch-ua-bitness': '"64"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-ch-ua-platform-version': '"10.0.0"',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'priority': 'u=1, i',
                'Connection': 'keep-alive',
                'Content-Length': Buffer.byteLength(requestBody)
            }
        };

        const req = https.request(options, (res: any) => {
            let data = '';

            const encoding = res.headers['content-encoding'];
            let stream: any = res;

            if (encoding === 'gzip' || encoding === 'deflate' || encoding === 'br') {
                const zlib = require('zlib');
                if (encoding === 'gzip') {
                    stream = res.pipe(zlib.createGunzip());
                } else if (encoding === 'deflate') {
                    stream = res.pipe(zlib.createInflate());
                } else if (encoding === 'br') {
                    stream = res.pipe(zlib.createBrotliDecompress());
                }
            }

            stream.on('data', (chunk: any) => {
                data += chunk;
            });

            stream.on('end', () => {
                try {
                    if (res.statusCode !== 200) {
                        reject(new Error(`获取团队列表失败，状态码: ${res.statusCode}`));
                        return;
                    }

                    const json = JSON.parse(data);
                    resolve(json);
                } catch (error) {
                    reject(new Error(`解析团队列表失败: ${error}`));
                }
            });
        });

        req.on('error', (error: any) => {
            reject(new Error(`获取团队列表网络请求失败: ${error.message}`));
        });

        req.write(requestBody);
        req.end();
    });
}

