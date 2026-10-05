import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
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
    @CurrentUser() user,
    @Body() dto: QueryDto,
    @Res() response: Response,
  ) {
    const context = await this.chatService.getContext(user, body.query);

    response.setHeader('Content-Type', 'text/plain; charset=utf-8');
    response.setHeader('Transfer-Encoding', 'chunked');

    const result = await this.ragService.generateReplyStream(
      body.query,
      context,
    );

    for await (const chunk of result.stream) {
      const text = chunk.text();
      response.write(text);
    }

    response.end();
  }
}
