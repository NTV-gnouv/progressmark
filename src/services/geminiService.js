const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');
const config = require('../config');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  }

  /**
   * Evaluate task progress using Gemini AI
   * @param {Object} taskData - Task information
   * @param {Array} worklogs - Work logs from the task
   * @returns {Promise<Object>} AI evaluation result
   */
  async evaluateTaskProgress(taskData, worklogs) {
    const maxRetries = 3;
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const prompt = this.buildEvaluationPrompt(taskData, worklogs);
        
        logger.info(`Sending request to Gemini AI (attempt ${attempt})`, {
          taskId: taskData.id,
          worklogsCount: worklogs.length
        });

        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Validate structure first
        const isValidStructure = this.validateResponseStructure(text);
        
        if (!isValidStructure) {
          logger.warn(`AI response structure invalid on attempt ${attempt}`, {
            taskId: taskData.id,
            response: text.substring(0, 200) + '...'
          });
          
          if (attempt === maxRetries) {
            logger.warn('Max retries reached, using parsed response anyway');
          } else {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
        }

        // Parse the response to extract percentage and description
        const evaluation = this.parseAIResponse(text);

        logger.info('Gemini AI evaluation completed', {
          taskId: taskData.id,
          score: evaluation.scorePercent,
          attempt: attempt,
          structureValid: isValidStructure
        });

        return evaluation;
      } catch (error) {
        lastError = error;
        logger.error(`Gemini AI evaluation attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          throw new Error(`AI evaluation failed after ${maxRetries} attempts: ${error.message}`);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Build evaluation prompt for Gemini
   */
  buildEvaluationPrompt(taskData, worklogs) {
    const worklogsText = worklogs.map(log => 
      `- ${log.createdAt.toISOString().split('T')[0]}: ${log.content} (${log.spentMinutes} phút)`
    ).join('\n');

    return `
Bạn là một chuyên gia đánh giá tiến độ công việc. Hãy phân tích nhiệm vụ và các báo cáo công việc để đánh giá mức độ hoàn thành.

THÔNG TIN NHIỆM VỤ:
- Tiêu đề: ${taskData.title}
- Mô tả: ${taskData.description || 'Không có mô tả'}
- Trạng thái: ${taskData.status}
- Ưu tiên: ${taskData.priority}
- Ngày bắt đầu: ${taskData.startDate ? taskData.startDate.toISOString().split('T')[0] : 'Chưa xác định'}
- Ngày hết hạn: ${taskData.dueDate ? taskData.dueDate.toISOString().split('T')[0] : 'Chưa xác định'}
- Ước tính giờ: ${taskData.estimateHours || 'Chưa xác định'}

BÁO CÁO CÔNG VIỆC:
${worklogsText || 'Chưa có báo cáo công việc nào'}

YÊU CẦU:
1. Phân tích mức độ hoàn thành nhiệm vụ dựa trên:
   - Số lượng công việc đã thực hiện so với yêu cầu
   - Chất lượng báo cáo công việc
   - Tiến độ theo thời gian (nếu có deadline)
   - Mức độ chi tiết và cụ thể trong báo cáo

2. Đưa ra đánh giá theo định dạng: [SỐ_PHẦN_TRĂM]%| [MÔ_TẢ_CHI_TIẾT]

3. Mô tả phải:
   - Ngắn gọn tối đa 30-40 ký tựtự, rõ ràng 
   - Chỉ ra cụ thể đã làm được gì
   - Nêu rõ những gì còn thiếu (nếu có)
   - Sử dụng tiếng Việt

ĐỊNH DẠNG TRẢ LỜI BẮT BUỘC:
Bạn PHẢI trả lời theo đúng cấu trúc sau (không được thay đổi):

Score: [SỐ_PHẦN_TRĂM]%
Summary: [MÔ_TẢ_CHI_TIẾT_LÝ_DO_CHẤM_ĐIỂM]
Verdict: [pass/conditional/fail]

VÍ DỤ:
Score: 80%
Summary: Bạn đã thực hiện 8 trên 10 vấn đề được yêu cầu, báo cáo chi tiết và đúng tiến độ
Verdict: pass

Score: 45%
Summary: Đã hoàn thành một nửa công việc, cần bổ sung thêm báo cáo chi tiết hơn
Verdict: conditional

Score: 100%
Summary: Hoàn thành xuất sắc tất cả yêu cầu, báo cáo đầy đủ và chất lượng cao
Verdict: pass

Hãy đánh giá nhiệm vụ này theo đúng định dạng trên:
`;
  }

  /**
   * Parse AI response to extract percentage and description
   */
  parseAIResponse(responseText) {
    try {
      // Validate structure first
      const isValidStructure = this.validateResponseStructure(responseText);
      
      if (!isValidStructure) {
        logger.warn('AI response structure invalid, attempting to extract data anyway');
      }

      // Extract Score
      const scoreMatch = responseText.match(/Score:\s*(\d+)%/i);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : null;

      // Extract Summary
      const summaryMatch = responseText.match(/Summary:\s*(.+?)(?:\n|Verdict:|$)/is);
      const summary = summaryMatch ? summaryMatch[1].trim() : null;

      // Extract Verdict
      const verdictMatch = responseText.match(/Verdict:\s*(pass|conditional|fail)/i);
      const verdict = verdictMatch ? verdictMatch[1].toLowerCase() : null;

      // Validate extracted data
      if (score === null || summary === null || verdict === null) {
        logger.warn('Failed to extract all required fields from AI response');
        
        // Fallback to old format
        const oldMatch = responseText.match(/(\d+)%\s*\|\s*(.+)/);
        if (oldMatch) {
          const fallbackScore = parseInt(oldMatch[1]);
          return {
            scorePercent: Math.min(100, Math.max(0, fallbackScore)),
            summary: oldMatch[2].trim(),
            verdict: this.getVerdictFromScore(fallbackScore)
          };
        }
        
        // Last resort fallback
        const percentageMatch = responseText.match(/(\d+)%/);
        const fallbackScore = percentageMatch ? parseInt(percentageMatch[1]) : 50;
        return {
          scorePercent: Math.min(100, Math.max(0, fallbackScore)),
          summary: responseText.trim(),
          verdict: this.getVerdictFromScore(fallbackScore)
        };
      }

      return {
        scorePercent: Math.min(100, Math.max(0, score)),
        summary: summary,
        verdict: verdict
      };
    } catch (error) {
      logger.error('Failed to parse AI response:', error);
      
      // Fallback response
      return {
        scorePercent: 50,
        summary: 'Không thể phân tích đánh giá AI. Vui lòng thử lại.',
        verdict: 'conditional'
      };
    }
  }

  /**
   * Validate AI response structure
   */
  validateResponseStructure(responseText) {
    const requiredPatterns = [
      /Score:\s*\d+%/i,
      /Summary:\s*.+/i,
      /Verdict:\s*(pass|conditional|fail)/i
    ];

    return requiredPatterns.every(pattern => pattern.test(responseText));
  }

  /**
   * Get verdict from score
   */
  getVerdictFromScore(score) {
    if (score >= 80) return 'pass';
    if (score >= 60) return 'borderline';
    return 'fail';
  }

  /**
   * Test Gemini connection
   */
  async testConnection() {
    try {
      const result = await this.model.generateContent('Xin chào, bạn có hoạt động không?');
      const response = await result.response;
      return response.text();
    } catch (error) {
      logger.error('Gemini connection test failed:', error);
      throw error;
    }
  }
}

module.exports = new GeminiService();
