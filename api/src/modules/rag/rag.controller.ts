import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { QueryDto } from './dto/query.dto';
import { AuthGuard } from '../../shared/guards/auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { RagService } from './rag.service';

@Controller('rag')
@UseGuards(AuthGuard)
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('query')
  async answerQuestion(@CurrentUser() user: any, @Body() dto: QueryDto) {
    return this.ragService.generateReply(dto);
  }
}
