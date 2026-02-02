import NotificationQueue from '../NotificationQueue';

describe('NotificationQueue', () => {
  let queue;
  let onUpdate;

  beforeEach(() => {
    onUpdate = jest.fn();
    queue = new NotificationQueue({ maxVisible: 4, onUpdate });
  });

  test('adds tweet to queue', () => {
    const tweet = { id: '1', text: 'Test tweet' };
    queue.add(tweet);
    expect(queue.getVisible()).toHaveLength(1);
    expect(queue.getVisible()[0].id).toBe('1');
  });

  test('respects maxVisible limit', () => {
    for (let i = 1; i <= 6; i++) {
      queue.add({ id: String(i), text: `Tweet ${i}` });
    }
    expect(queue.getVisible()).toHaveLength(4);
    expect(queue.getQueue()).toHaveLength(2);
  });

  test('removes notification after dismiss', () => {
    queue.add({ id: '1', text: 'Test' });
    queue.dismiss('1');
    expect(queue.getVisible()).toHaveLength(0);
  });

  test('promotes queued items when visible slot opens', () => {
    for (let i = 1; i <= 5; i++) {
      queue.add({ id: String(i), text: `Tweet ${i}` });
    }
    queue.dismiss('1');
    const visible = queue.getVisible();
    expect(visible).toHaveLength(4);
    expect(visible.some(t => t.id === '5')).toBe(true);
  });

  test('auto-dismisses after timeout', (done) => {
    queue = new NotificationQueue({ maxVisible: 4, dismissAfter: 100, onUpdate });
    queue.add({ id: '1', text: 'Test' });
    
    setTimeout(() => {
      expect(queue.getVisible()).toHaveLength(0);
      done();
    }, 150);
  });
});
