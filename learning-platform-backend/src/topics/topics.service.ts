import { Injectable } from '@nestjs/common';
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
      topicMap.set(topic.id, { ...topic, children: [] } as TopicTreeNode);
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
  async createTopic(data: Partial<Topic>): Promise<Topic> {
    const topic = this.topicsRepository.create(data);
    return this.topicsRepository.save(topic);
  }
}
