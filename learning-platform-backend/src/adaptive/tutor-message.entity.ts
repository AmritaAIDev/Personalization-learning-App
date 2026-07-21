import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TutorMessageRole, TutorMessageType } from './adaptive.types';
import { TutorConversation } from './tutor-conversation.entity';

@Entity('tutor_messages')
export class TutorMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'conversation_id', type: 'uuid' })
  conversationId: string;

  @ManyToOne(() => TutorConversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: TutorConversation;

  @Column({ type: 'varchar', length: 20 })
  role: TutorMessageRole;

  @Column({ name: 'message_type', type: 'varchar', length: 32 })
  messageType: TutorMessageType;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'related_session_item_id', type: 'uuid', nullable: true })
  relatedSessionItemId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
