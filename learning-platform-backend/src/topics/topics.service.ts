import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topic } from './topic.entity';

export type TopicTreeNode = Topic & { children: TopicTreeNode[] };

@Injectable()
export class TopicsService {
  constructor(
    @InjectRepository(Topic)
    private topicsRepository: Repository<Topic>,
  ) {}

  // Fetch the entire curriculum tree
  async getTopicTree(): Promise<TopicTreeNode[]> {
    // We can fetch all topics and build the tree in memory to avoid N+1 query issues
    const allTopics = await this.topicsRepository.find({
      relations: { parent: true },
    });

    // Create a map for quick lookup
    const topicMap = new Map<string, TopicTreeNode>();
    allTopics.forEach((topic) => {
      topicMap.set(topic.id, { ...topic, children: [] });
    });

    const rootTopics: TopicTreeNode[] = [];

    // Assemble the tree
    allTopics.forEach((topic) => {
      const node = topicMap.get(topic.id);
      if (node) {
        if (topic.parent) {
          const parentNode = topicMap.get(topic.parent.id);
          if (parentNode) {
            parentNode.children.push(node);
          }
        } else {
          rootTopics.push(node);
        }
      }
    });

    return rootTopics;
  }

  // Create a new topic (Subject, Chapter, etc.)
  async createTopic(data: {
    name: string;
    description?: string;
    level: Topic['level'];
    parentId?: string;
  }): Promise<Topic> {
    const topic = this.topicsRepository.create({
      name: data.name,
      description: data.description,
      level: data.level,
      parent: data.parentId ? { id: data.parentId } : undefined,
    });
    return this.topicsRepository.save(topic);
  }

  // Update a topic's name, description, or position in the hierarchy
  async updateTopic(
    id: string,
    data: { name?: string; description?: string; parentId?: string | null },
  ): Promise<Topic> {
    const topic = await this.topicsRepository.findOne({ where: { id } });
    if (!topic) {
      throw new NotFoundException('Topic not found.');
    }
    if (data.name !== undefined) topic.name = data.name;
    if (data.description !== undefined) topic.description = data.description;
    if (data.parentId !== undefined) {
      if (data.parentId === id) {
        throw new BadRequestException('A topic cannot be its own parent.');
      }
      topic.parent = data.parentId ? ({ id: data.parentId } as Topic) : null;
    }
    return this.topicsRepository.save(topic);
  }

  // Delete a topic. Child topics cascade-delete at the database level.
  async deleteTopic(id: string): Promise<void> {
    const result = await this.topicsRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException('Topic not found.');
    }
  }

  // Get prerequisites for a specific topic (Fallback logic)
  async getPrerequisites(topicId: string): Promise<Topic[]> {
    const topic = await this.topicsRepository.findOne({
      where: { id: topicId },
      relations: { prerequisites: true },
    });
    return topic?.prerequisites || [];
  }
}
