import * as expect from 'expect';
import { Spy, spy } from '@paychex/core/test';

import { batch, TrackingSubscriber, utils } from '../index';

describe('patch collector', () => {

    let send: Spy,
        collector: TrackingSubscriber;

    beforeEach(() => {
        send = spy();
        collector = batch(send, utils.toPatch);
    });

    it('returns expected collector', () => {
        expect(collector).toBeInstanceOf(Function);
    });

    it('throws if send not a function', () => {
        expect(() => batch(null)).toThrow();
    });

    it('queues all entries within a frame', (done) => {
        collector({ label: 'abc' } as any);
        collector({ label: 'def' } as any);
        collector({ label: 'ghi' } as any);
        setTimeout(() => {
            expect(send.callCount).toBe(1);
            expect(send.args[0]).toEqual([
                expect.any(Object),
                expect.any(Array),
                expect.any(Array),
            ]);
            done();
        });
    });

    it('sends 1 batch at a time', (done) => {
        send.invokes(() => new Promise(resolve => setTimeout(resolve, 10)));
        collector({ label: 'abc' } as any);
        setTimeout(() => {
            expect(send.callCount).toBe(1);
            collector({ label: 'abc' } as any);
            setTimeout(() => {
                expect(send.callCount).toBe(2);
                expect(send.args).toEqual(send.calls[0].args);
                done();
            }, 10);
        });
    });

    it('logs error if send fails', (done) => {
        const error = console.error;
        console.error = spy();
        send.throws(new Error());
        collector({ label: 'abc' } as any);
        setTimeout(() => {
            expect((console.error as unknown as Spy).called).toBe(true);
            console.error = error;
            done();
        });
    });

    it('will retry failed entries on next send', (done) => {
        const error = console.error;
        console.error = spy();
        send.onCall(0).throws(new Error());
        collector({ label: 'abc' } as any);
        setTimeout(() => {
            collector({ label: 'abc', another: 'def' } as any);
            setTimeout(() => {
                console.error = error;
                expect(send.args).toEqual([[
                    { label: 'abc' },
                    [{ op: 'add', path: '/another', value: 'def' }],
                ]]);
                done();
            });
        });
    });

    it('sends single entry', (done) => {
        collector({ label: 'abc' } as any);
        setTimeout(() => {
            expect(send.args[0]).toEqual([ { label: 'abc' }]);
            done();
        });
    });

    it('sends batch payload with diffs', (done) => {
        collector({ label: 'abc' } as any);
        collector({ label: 'def', another: 'key' } as any);
        collector({ another: 'key' } as any);
        setTimeout(() => {
            expect(send.args[0]).toEqual([
                { "label": "abc" },
                [
                    {
                        "op": "replace",
                        "path": "/label",
                        "value": "def"
                    },
                    {
                        "op": "add",
                        "path": "/another",
                        "value": "key"
                    }
                ],
                [
                    {
                        "op": "remove",
                        "path": "/label"
                    }
                ]
            ]);
            done();
        });
    });

    it('excludes empty diffs', (done) => {
        collector({ label: 'abc' } as any);
        collector({ label: 'abc' } as any);
        collector({ label: 'def' } as any);
        setTimeout(() => {
            expect(send.args[0]).toEqual([
                { label: 'abc' },
                [{ op: 'replace', path: '/label', value: 'def' }]
            ]);
            done();
        });
    });

    it('uses default coalesce function', (done) => {
        collector = batch(send);
        collector({ count: 1 } as any);
        collector({ count: 2 } as any);
        collector({ count: 3 } as any);
        setTimeout(() => {
            expect(send.args[0]).toEqual([
                { count: 1 },
                { count: 2 },
                { count: 3 },
            ]);
            done();
        });
    });

    it('uses provided coalesce function', (done) => {
        const coalesce = spy();
        collector = batch(send, coalesce);
        collector({ count: 1 } as any);
        collector({ count: 2 } as any);
        collector({ count: 3 } as any);
        setTimeout(() => {
            expect(coalesce.args[0]).toEqual([
                { count: 1 },
                { count: 2 },
                { count: 3 },
            ]);
            done();
        });
    });

});
