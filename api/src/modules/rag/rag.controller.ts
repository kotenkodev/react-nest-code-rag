import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { QueryDto } from './dto/query.dto';
import { AuthGuard } from '../../shared/guards/auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { RagService } from './rag.service';

@Controller('rag')
@UseGuards(AuthGuard)
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('query')
  async answerQuestion(
    @CurrentUser() user: { email: string },
    @Body() dto: QueryDto,
    @Res() response: Response,
  ) {
    const { stream, sources } = await this.ragService.prepareRagStream(
      user.email,
      dto.query,
    );

    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');

    response.write(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`);

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        response.write(`data: ${JSON.stringify({ type: 'delta', text })}\n\n`);
      }
    }

    response.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    response.end();
  }
}
