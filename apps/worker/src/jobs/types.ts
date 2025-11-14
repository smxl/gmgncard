export type QueueJob =
  | { type: 'daily-backup' }
  | {
      type: 'record-link-click';
      payload: {
        linkId: number;
        handle?: string;
        referrer?: string;
        userAgent?: string;
        country?: string;
      };
    }
  | {
      type: 'qr-cache';
      payload: {
        userId: number;
        handle: string;
        target: 'wechat' | 'group';
        sourceUrl: string;
      };
    };
