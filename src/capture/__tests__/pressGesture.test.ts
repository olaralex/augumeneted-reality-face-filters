import { createPressGesture } from '../pressGesture';

describe('createPressGesture', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());
  const mk = () => {
    const cb = { onTap: jest.fn(), onHoldStart: jest.fn(), onHoldEnd: jest.fn() };
    return { cb, g: createPressGesture(cb) };
  };

  it('short press is a tap', () => {
    const { cb, g } = mk();
    g.pressIn();
    jest.advanceTimersByTime(100);
    g.pressOut();
    jest.advanceTimersByTime(1000);
    expect(cb.onTap).toHaveBeenCalledTimes(1);
    expect(cb.onHoldStart).not.toHaveBeenCalled();
    expect(cb.onHoldEnd).not.toHaveBeenCalled();
  });

  it('long press starts and ends a hold, no tap', () => {
    const { cb, g } = mk();
    g.pressIn();
    jest.advanceTimersByTime(300);
    expect(cb.onHoldStart).toHaveBeenCalledTimes(1);
    g.pressOut();
    expect(cb.onHoldEnd).toHaveBeenCalledTimes(1);
    expect(cb.onTap).not.toHaveBeenCalled();
  });
});
