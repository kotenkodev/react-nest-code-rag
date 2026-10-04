import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { from, mergeMap } from 'rxjs';

@Injectable()
export class RepositoriesService {
  constructor(private readonly PrismaService: PrismaService) {}

  async cloneGithubRepository(url: string, branch: string) {
    const filesTree = await fetch(`${url}/git/trees/${branch}?recursive=true`, {
      method: 'GET',
    });

    const { tree } = await filesTree.json();

    tree.forEach(async (node: any) => {
      if (node.type === 'blob') {
        const fileResponse = await fetch(node.url, {
          method: 'GET',
        });

        const fileContent = await fileResponse.text();
        console.log(fileContent);
      }
    });

    return tree;
  }

  getStatusObservable(email: string) {
    return from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).pipe(
      mergeMap(
        (i) => from(fetch(`https://jsonplaceholder.typicode.com/posts/${i}`)),
        2,
      ),
    );
  }
}
