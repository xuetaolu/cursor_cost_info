import * as vscode from 'vscode';

/**
 * 从 VS Code 配置读取 Cursor Cookie
 * @returns Cookie 字符串，如果未配置则返回 null
 */
export function readCursorCookie(): string | null {
    const config = vscode.workspace.getConfiguration('cursorCostInfo');
    const cookie = config.get<string>('cookie', '');

    if (!cookie || cookie.trim() === '') {
        return null;
    }

    return cookie.trim();
}

/**
 * 获取配置说明文本
 */
export function getConfigHelpText(): string {
    return '请在 VS Code 设置中配置 cursorCostInfo.cookie';
}

/**
 * 验证 Cookie 格式
 * @param cookie Cookie 字符串
 * @returns 是否有效
 */
export function validateCookie(cookie: string | null): boolean {
    if (!cookie) {
        return false;
    }

    // 简单验证：Cookie 应该包含一些常见的字段
    // 可以根据实际需要调整验证逻辑
    return cookie.length > 10;
}

