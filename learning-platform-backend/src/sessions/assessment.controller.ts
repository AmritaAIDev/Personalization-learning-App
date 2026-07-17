import { Controller, Post, Body, Param } from '@nestjs/common';
import { AssessmentService } from './assessment.service';

@Controller('assessment')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post('start/:userId/:topicId')
  async startAssessment(
    @Param('userId') userId: string,
    @Param('topicId') topicId: string,
  ) {
    return this.assessmentService.startAssessment(userId, topicId);
  }

  @Post('submit/:userId/:topicId')
  async submitAnswer(
    @Param('userId') userId: string,
    @Param('topicId') topicId: string,
    @Body('questionId') questionId: string,
    @Body('isCorrect') isCorrect: boolean,
  ) {
    return this.assessmentService.submitAnswer(
      userId,
      topicId,
      questionId,
      isCorrect,
    );
  }
}
