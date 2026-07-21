import { Controller, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { SubmitAssessmentAnswerDto } from './assessment.dto';
import { AssessmentService } from './assessment.service';

/** Legacy adaptive-engine endpoint. Student diagnostics use DiagnosticsModule. */
@Roles('admin')
@Controller('api/assessment')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post('start/:topicId')
  async startAssessment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('topicId', ParseUUIDPipe) topicId: string,
  ) {
    return this.assessmentService.startAssessment(user.id, topicId);
  }

  @Post('submit/:topicId')
  async submitAnswer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('topicId', ParseUUIDPipe) topicId: string,
    @Body() body: SubmitAssessmentAnswerDto,
  ) {
    return this.assessmentService.submitAnswer(
      user.id,
      topicId,
      body.questionId,
      body.selectedOption,
    );
  }
}
