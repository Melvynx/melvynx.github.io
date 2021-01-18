
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    function is_date(obj) {
        return Object.prototype.toString.call(obj) === '[object Date]';
    }

    function tick_spring(ctx, last_value, current_value, target_value) {
        if (typeof current_value === 'number' || is_date(current_value)) {
            // @ts-ignore
            const delta = target_value - current_value;
            // @ts-ignore
            const velocity = (current_value - last_value) / (ctx.dt || 1 / 60); // guard div by 0
            const spring = ctx.opts.stiffness * delta;
            const damper = ctx.opts.damping * velocity;
            const acceleration = (spring - damper) * ctx.inv_mass;
            const d = (velocity + acceleration) * ctx.dt;
            if (Math.abs(d) < ctx.opts.precision && Math.abs(delta) < ctx.opts.precision) {
                return target_value; // settled
            }
            else {
                ctx.settled = false; // signal loop to keep ticking
                // @ts-ignore
                return is_date(current_value) ?
                    new Date(current_value.getTime() + d) : current_value + d;
            }
        }
        else if (Array.isArray(current_value)) {
            // @ts-ignore
            return current_value.map((_, i) => tick_spring(ctx, last_value[i], current_value[i], target_value[i]));
        }
        else if (typeof current_value === 'object') {
            const next_value = {};
            for (const k in current_value) {
                // @ts-ignore
                next_value[k] = tick_spring(ctx, last_value[k], current_value[k], target_value[k]);
            }
            // @ts-ignore
            return next_value;
        }
        else {
            throw new Error(`Cannot spring ${typeof current_value} values`);
        }
    }
    function spring(value, opts = {}) {
        const store = writable(value);
        const { stiffness = 0.15, damping = 0.8, precision = 0.01 } = opts;
        let last_time;
        let task;
        let current_token;
        let last_value = value;
        let target_value = value;
        let inv_mass = 1;
        let inv_mass_recovery_rate = 0;
        let cancel_task = false;
        function set(new_value, opts = {}) {
            target_value = new_value;
            const token = current_token = {};
            if (value == null || opts.hard || (spring.stiffness >= 1 && spring.damping >= 1)) {
                cancel_task = true; // cancel any running animation
                last_time = now();
                last_value = new_value;
                store.set(value = target_value);
                return Promise.resolve();
            }
            else if (opts.soft) {
                const rate = opts.soft === true ? .5 : +opts.soft;
                inv_mass_recovery_rate = 1 / (rate * 60);
                inv_mass = 0; // infinite mass, unaffected by spring forces
            }
            if (!task) {
                last_time = now();
                cancel_task = false;
                task = loop(now => {
                    if (cancel_task) {
                        cancel_task = false;
                        task = null;
                        return false;
                    }
                    inv_mass = Math.min(inv_mass + inv_mass_recovery_rate, 1);
                    const ctx = {
                        inv_mass,
                        opts: spring,
                        settled: true,
                        dt: (now - last_time) * 60 / 1000
                    };
                    const next_value = tick_spring(ctx, last_value, value, target_value);
                    last_time = now;
                    last_value = value;
                    store.set(value = next_value);
                    if (ctx.settled) {
                        task = null;
                    }
                    return !ctx.settled;
                });
            }
            return new Promise(fulfil => {
                task.promise.then(() => {
                    if (token === current_token)
                        fulfil();
                });
            });
        }
        const spring = {
            set,
            update: (fn, opts) => set(fn(target_value, value), opts),
            subscribe: store.subscribe,
            stiffness,
            damping,
            precision
        };
        return spring;
    }

    /* src/animation/MelvynxLogoSvg.svelte generated by Svelte v3.31.2 */

    const file = "src/animation/MelvynxLogoSvg.svelte";

    function create_fragment(ctx) {
    	let svg;
    	let defs;
    	let g;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			defs = svg_element("defs");
    			g = svg_element("g");
    			path = svg_element("path");
    			attr_dev(defs, "id", "defs204");
    			add_location(defs, file, 11, 2, 317);
    			set_style(path, "fill", "#f0f0f0");
    			attr_dev(path, "d", "m 82.238095,183.92857 c 0,-0.825 0.60277,-1.5 1.33948,-1.5 0.73672,0 1.84928,-1.11887 2.47236,-2.48637 0.96136,-2.10996 0.60717,-3.73285 -2.33949,-10.71965 -1.90979,-4.52829 -3.47235,-8.35942 -3.47235,-8.51362 0,-0.1542 1.575,-0.28036 3.5,-0.28036 1.925,0 3.5,0.45 3.5,1 0,0.55 -0.48032,1 -1.06739,1 -1.09951,0 -0.70694,1.94522 1.51295,7.49672 l 1.1983,2.99672 1.61132,-4.72896 c 0.94531,-2.77431 1.22557,-4.96736 0.67807,-5.30573 -2.02122,-1.24918 -0.75852,-2.45875 2.56675,-2.45875 3.48406,0 4.25741,0.74062 2.66272,2.55 -0.46051,0.5225 -2.31979,5 -4.13173,9.95 -1.81195,4.95 -3.97992,9.7875 -4.81771,10.75 -1.86478,2.14236 -5.21328,2.30294 -5.21328,0.25 z M 1.2380952,177.39719 c 0,-0.56727 0.675,-1.29041 1.5,-1.60699 1.18602,-0.45512 1.5,-2.54177 1.5,-9.96862 0,-7.68268 -0.27313,-9.39301 -1.5,-9.39301 -0.825,0 -1.5,-0.45 -1.5,-1 0,-0.55 1.70641,-1 3.79203,-1 h 3.79203 l 3.3609998,9 c 1.84855,4.95 3.62964,8.99567 3.95797,8.99038 0.32833,-0.005 2.11229,-4.05528 3.96435,-9 3.3279,-8.88497 3.40704,-8.99038 6.75,-8.99038 1.86044,0 3.38262,0.45 3.38262,1 0,0.55 -0.45,1 -1,1 -0.59649,0 -1,3.83333 -1,9.5 0,5.66667 0.40351,9.5 1,9.5 0.55,0 1,0.675 1,1.5 0,1.08333 -1.11111,1.5 -4,1.5 -3.95598,0 -4.82103,-0.70511 -3.12841,-2.55 1.18051,-1.2867 2.35502,-15.08372 1.1815,-13.8791 -0.49781,0.51101 -2.23815,4.3041 -3.86743,8.4291 -1.62927,4.125 -3.53168,7.5 -4.22756,7.5 -0.69588,0 -2.88363,-3.825 -4.86167,-8.5 l -3.5964298,-8.5 -0.29985,6.93235 c -0.2354,5.44241 0.0333,7.11877 1.25,7.79969 2.8471598,1.59335 1.5952298,2.76796 -2.95015,2.76796 -2.475,0 -4.5,-0.46412 -4.5,-1.03138 z m 34.0725798,-1.60348 c -4.55539,-5.79124 -1.24748,-15.36514 5.30887,-15.36514 4.43267,0 6.55338,1.82357 7.27223,6.25328 l 0.608,3.74672 h -6.1094 -6.1094 l 1.18759,2.60649 c 1.07166,2.35202 1.60653,2.55927 5.47857,2.12284 3.0563,-0.34449 4.29096,-0.11818 4.29096,0.78652 0,1.61967 -2.26519,2.48415 -6.50921,2.48415 -2.42327,0 -3.91702,-0.72641 -5.41821,-2.63486 z m 8.92742,-9.82996 c 0,-2.12275 -3.18375,-3.57148 -5.27582,-2.4007 -3.05137,1.70763 -2.06003,3.86552 1.77582,3.86552 2.40708,0 3.5,-0.45741 3.5,-1.46482 z m 6,11.43344 c 0,-0.56727 0.675,-1.29041 1.5,-1.60699 1.19193,-0.45739 1.5,-2.58543 1.5,-10.36163 0,-7.7762 -0.30807,-9.90424 -1.5,-10.36163 -2.57778,-0.98919 -1.64017,-2.63837 1.5,-2.63837 h 3 v 11.39301 c 0,9.20463 0.28812,11.50357 1.5,11.96862 3.0414,1.16709 1.36845,2.63837 -3,2.63837 -2.475,0 -4.5,-0.46412 -4.5,-1.03138 z m 15.53711,-6.17873 c -1.54559,-4.00944 -3.19873,-7.71739 -3.67364,-8.23989 -1.63372,-1.79744 -0.85562,-2.55 2.63653,-2.55 3.24249,0 4.82773,1.39076 2.47801,2.174 -0.64458,0.21486 -0.41528,2.12124 0.62094,5.16239 1.79965,5.28167 2.5227,5.15284 4.42444,-0.78832 0.93605,-2.92425 0.96746,-4.05112 0.12081,-4.33334 -2.45292,-0.81764 -0.96683,-2.21473 2.3558,-2.21473 1.925,0 3.49243,0.1125 3.48318,0.25 -0.14874,2.21043 -7.27524,17.32969 -8.26748,17.53989 -0.87946,0.1863 -2.37256,-2.31495 -4.17859,-7 z m 33.46289,6.17873 c 0,-0.56727 0.675,-1.29041 1.500005,-1.60699 1.09977,-0.42202 1.5,-2.15636 1.5,-6.5 0,-4.34364 -0.40023,-6.07798 -1.5,-6.5 -2.541425,-0.97524 -1.660855,-2.36163 1.5,-2.36163 1.66667,0 3,0.53333 3,1.2 0,0.93333 0.26667,0.93333 1.2,0 1.69902,-1.69902 6.36891,-1.48823 8.22857,0.37143 1.06866,1.06866 1.57143,3.434 1.57143,7.39301 0,4.25225 0.40436,5.97675 1.5,6.39719 3.0414,1.16709 1.36845,2.63837 -3,2.63837 -4.36845,0 -6.0414,-1.47128 -3,-2.63837 1.03872,-0.3986 1.49529,-2.00342 1.48469,-5.21862 -0.0196,-5.92683 -0.98038,-7.3855 -4.5932,-6.97309 -2.74788,0.31369 -2.90681,0.59964 -3.19991,5.75764 -0.23335,4.10664 0.0709,5.63981 1.25,6.29969 2.85526,1.59788 1.60885,2.77275 -2.94158,2.77275 -2.475,0 -4.500005,-0.46412 -4.500005,-1.03138 z m 22.000005,0.1083 c 0,-0.50769 1.35,-2.27307 3,-3.92307 1.65,-1.65 3,-3.62543 3,-4.38984 0,-0.7644 -1.35,-2.68321 -3,-4.26401 -3.88611,-3.72313 -3.78132,-4.5 0.60699,-4.5 2.92027,0 3.48814,0.30971 2.98275,1.62675 -0.34334,0.89471 -0.10678,2.25026 0.52569,3.01233 1.57543,1.89828 4.14559,-0.24131 3.33976,-2.78026 -0.49977,-1.57464 -0.0446,-1.85882 2.97742,-1.85882 1.96207,0 3.56739,0.27809 3.56739,0.61798 0,0.3399 -1.35,2.15556 -3,4.0348 -1.65,1.87925 -3,3.78212 -3,4.22862 0,0.44649 1.575,2.43352 3.5,4.41563 1.925,1.98211 3.5,3.87831 3.5,4.21377 0,0.33546 -1.65266,0.47027 -3.67258,0.29957 -2.99074,-0.25275 -3.70233,-0.728 -3.83284,-2.55988 -0.21889,-3.07232 -1.15538,-3.77689 -2.99299,-2.25181 -0.89864,0.74581 -1.29954,2.06255 -0.95678,3.1425 0.49977,1.57464 0.0446,1.85882 -2.97742,1.85882 -1.96207,0 -3.56739,-0.41538 -3.56739,-0.92308 z M 39.326875,129.9085 c -5.9924,-9.44716 -8.48556,-23.09064 -5.75252,-31.479929 l 1.466,-4.5 0.0989,6.644659 c 0.0967,6.50183 3.42469,19.85534 4.94832,19.85534 0.42301,0 2.84887,-2.40899 5.39081,-5.35331 4.52661,-5.24319 9.78345,-8.64669 13.35512,-8.64669 1.30383,0 0.87817,0.67505 -1.55986,2.47377 -4.98074,3.67468 -10.56196,12.17671 -12.80495,19.50616 l -1.98302,6.47992 z m 38.16189,-8.02507 c -6.87409,-1.85104 -12.15917,-4.61663 -15.25067,-7.98041 l -2.5,-2.72019 4.07074,2.05174 c 5.29259,2.66758 17.38834,6.56825 18.11487,5.84173 0.31061,-0.31062 -0.16658,-2.39253 -1.06043,-4.62648 -2.99833,-7.49357 -1.63592,-19.874759 2.42621,-22.048759 2.17103,-1.1619 8.461,0.72192 15.11842,4.52789 7.565865,4.325329 13.696465,2.92012 15.299565,-3.50684 0.51606,-2.06891 0.078,-2.82968 -2.50913,-4.35796 l -3.13433,-1.85149 3.03119,-1.84338 c 2.76134,-1.67927 2.95049,-2.1248 2.12465,-5.00434 -0.4986,-1.73853 -1.37265,-6.51208 -1.94232,-10.60788 -2.45292,-17.63586 -11.531415,-26.67319 -30.661545,-30.52256 l -5.12211,-1.03067 -0.4963,-6.18282 c -0.27296,-3.400545 -1.29217,-7.737479 -2.2649,-9.637627 -2.43914,-4.764634 -7.27643,-10.767696 -9.73837,-12.085287 -1.80016,-0.9634156 -1.98359,-0.8470416 -1.51134,0.958838 0.9089,3.475639 -1.19617,10.709561 -4.89865,16.833867 -2.97556,4.921899 -3.45487,6.512199 -3.05508,10.136569 0.43957,3.98498 0.35084,4.18717 -1.21546,2.76969 -1.5418,-1.39531 -2.11691,-1.09533 -6.57238,3.42815 -2.68549,2.7265 -5.05261,4.78739 -5.26024,4.57975 -0.6037,-0.6037 4.68424,-10.56084 8.94802,-16.84905 9.28691,-13.69627 10.84848,-20.442786 6.28744,-27.1638476 l -2.52147,-3.715601 4.00749,2.252336 c 10.44381,5.86975 18.05537,14.8931986 21.05277,24.9578996 1.13706,3.818033 2.58125,6.941873 3.20931,6.941873 2.63819,0 9.91799,-4.394339 11.90679,-7.187355 1.91405,-2.688037 2.08539,-3.901051 1.57694,-11.164172 -0.4279,-6.112562 -0.31252,-7.5238426 0.4618,-5.648473 2.52889,6.124894 4.748515,15.666109 5.410845,23.2589 0.66347,7.60593 1.01089,8.5866 4.51358,12.74064 5.19212,6.15764 7.84584,12.62086 8.84684,21.54682 0.61122,5.45023 1.56621,8.62534 3.45084,11.47321 2.95114,4.45947 3.37834,9.58573 1.15683,13.88165 -1.78868,3.45893 -8.08062,9.098779 -10.1508,9.098779 -0.84157,0 -3.66983,2.19675 -6.28501,4.88166 -4.916605,5.04768 -10.426745,7.10642 -15.073105,5.63173 -2.80827,-0.89132 -2.56271,0.46795 0.9641,5.33657 l 3.00627,4.15004 -4.25627,-0.0658 c -2.34095,-0.0362 -6.61847,-0.7019 -9.5056,-1.47933 z m 19.41004,-12.3896 c 2.65098,-1.61645 5.353855,-5.757 4.180605,-6.40428 -6.855665,-3.782269 -13.844445,-6.597009 -15.142795,-6.098789 -2.03026,0.77909 -3.6537,6.221449 -2.95153,9.894629 0.88238,4.61585 8.33135,6.01233 13.91372,2.60844 z M 23.738535,94.178571 c -0.90415,-7.37673 0.82537,-19.25978 3.74777,-25.75 2.38436,-5.29531 10.48621,-15.59891 11.48235,-14.60277 0.26626,0.26626 -0.85988,2.87331 -2.50253,5.79344 -3.38038,6.00929 -5.82045,13.30083 -6.54541,19.55933 -0.51592,4.45383 0.0692,4.98838 3.46877,3.16898 1.11095,-0.59456 2.23317,-0.86775 2.49383,-0.60709 0.59502,0.59502 -9.8394,17.68811 -10.79765,17.68811 -0.38701,0 -0.99322,-2.3625 -1.34713,-5.25 z m 71.99956,-25.40494 c -1.1,-0.23261 -3.05268,-0.64907 -4.33928,-0.92546 -1.28661,-0.27638 -4.37291,-2.50737 -6.85844,-4.95775 l -4.51916,-4.45523 3.35844,0.5997 c 8.36162,1.4931 10.74686,2.46797 11.41641,4.66598 0.37323,1.22524 1.37011,3.0152 2.2153,3.9777 0.84519,0.9625 1.35446,1.6978 1.13172,1.634 -0.22275,-0.0638 -1.30499,-0.30632 -2.40499,-0.53894 z m -36.91314,-26.9793 c -1.31313,-3.42197 3.2771,-16.927581 6.41172,-18.864885 1.08084,-0.667995 4.94095,6.783506 4.97946,9.612285 0.0185,1.36166 -9.01788,10.88684 -10.32821,10.88684 -0.23972,0 -0.71806,-0.73541 -1.06297,-1.63424 z");
    			attr_dev(path, "id", "path214");
    			add_location(path, file, 13, 4, 359);
    			attr_dev(g, "id", "g208");
    			add_location(g, file, 12, 2, 341);
    			attr_dev(svg, "xmlns:dc", "http://purl.org/dc/elements/1.1/");
    			attr_dev(svg, "xmlns:cc", "http://creativecommons.org/ns#");
    			attr_dev(svg, "xmlns:rdf", "http://www.w3.org/1999/02/22-rdf-syntax-ns#");
    			attr_dev(svg, "xmlns:svg", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "version", "1.1");
    			attr_dev(svg, "id", "svg200");
    			attr_dev(svg, "width", "140");
    			attr_dev(svg, "height", "185");
    			attr_dev(svg, "viewBox", "0 0 140 185");
    			add_location(svg, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, defs);
    			append_dev(svg, g);
    			append_dev(g, path);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("MelvynxLogoSvg", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MelvynxLogoSvg> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class MelvynxLogoSvg extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MelvynxLogoSvg",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    function pannable(node) {
      let x;
      let y;

      function handleMouseUp() {
        x = event.clientX;
        y = event.clientY;

        node.dispatchEvent(
          new CustomEvent('panend', {
            detail: { x, y },
          })
        );

        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      }

      function handleMouseMove(event) {
        const dx = event.clientX - x;
        const dy = event.clientY - y;
        x = event.clientX;
        y = event.clientY;

        node.dispatchEvent(
          new CustomEvent('panmove', {
            detail: { x, y, dx, dy },
          })
        );
      }

      function handleMouseDown(event) {
        x = event.clientX;
        y = event.clientY;

        node.dispatchEvent(
          new CustomEvent('panstart', {
            detail: { x, y },
          })
        );

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
      }

      node.addEventListener('mousedown', handleMouseDown);

      return {
        destroy() {
          node.removeEventListener('mousedown');
        },
      };
    }

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }

    /* src/animation/MelvynxLogoAnim.svelte generated by Svelte v3.31.2 */
    const file$1 = "src/animation/MelvynxLogoAnim.svelte";

    // (29:2) {#if isPanMove}
    function create_if_block(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let div_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			if (img.src !== (img_src_value = "images/hello.gif")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "hello everyone");
    			attr_dev(img, "class", "svelte-s183ld");
    			add_location(img, file$1, 30, 6, 766);
    			attr_dev(div, "class", "xztiu svelte-s183ld");
    			add_location(div, file$1, 29, 4, 704);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { duration: 150 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { duration: 150 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(29:2) {#if isPanMove}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div1;
    	let t;
    	let div0;
    	let melvynxlogosvg;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*isPanMove*/ ctx[1] && create_if_block(ctx);
    	melvynxlogosvg = new MelvynxLogoSvg({ $$inline: true });

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t = space();
    			div0 = element("div");
    			create_component(melvynxlogosvg.$$.fragment);
    			attr_dev(div0, "class", "melvynx-logo-box svelte-s183ld");
    			set_style(div0, "background-color", /*isPanMove*/ ctx[1] ? "var(--bg-color)" : "transparent");
    			set_style(div0, "transform", "translate(" + /*$coords*/ ctx[2].x + "px, " + /*$coords*/ ctx[2].y + "px)\n      rotate(" + /*$coords*/ ctx[2].x * /*$coords*/ ctx[2].y * 0.001 + "deg)");
    			add_location(div0, file$1, 33, 2, 839);
    			attr_dev(div1, "class", "melvynx-logo-root");
    			add_location(div1, file$1, 27, 0, 650);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div1, t);
    			append_dev(div1, div0);
    			mount_component(melvynxlogosvg, div0, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(pannable.call(null, div0)),
    					listen_dev(div0, "panstart", /*handlePanStart*/ ctx[3], false, false, false),
    					listen_dev(div0, "panmove", /*handlePanMove*/ ctx[4], false, false, false),
    					listen_dev(div0, "panend", /*handlePanEnd*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*isPanMove*/ ctx[1]) {
    				if (if_block) {
    					if (dirty & /*isPanMove*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div1, t);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*isPanMove*/ 2) {
    				set_style(div0, "background-color", /*isPanMove*/ ctx[1] ? "var(--bg-color)" : "transparent");
    			}

    			if (!current || dirty & /*$coords*/ 4) {
    				set_style(div0, "transform", "translate(" + /*$coords*/ ctx[2].x + "px, " + /*$coords*/ ctx[2].y + "px)\n      rotate(" + /*$coords*/ ctx[2].x * /*$coords*/ ctx[2].y * 0.001 + "deg)");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(melvynxlogosvg.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(melvynxlogosvg.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			destroy_component(melvynxlogosvg);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $coords;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("MelvynxLogoAnim", slots, []);
    	let coords = spring({ x: 0, y: 0 }, { stiffness: 0.4, damping: 0.2 });
    	validate_store(coords, "coords");
    	component_subscribe($$self, coords, value => $$invalidate(2, $coords = value));
    	let isPanMove = false;

    	function handlePanStart() {
    		$$invalidate(0, coords.stiffness = $$invalidate(0, coords.damping = 0.3, coords), coords);
    		$$invalidate(1, isPanMove = true);
    	}

    	function handlePanMove(event) {
    		coords.update($coords => ({
    			x: $coords.x + event.detail.dx,
    			y: $coords.y + event.detail.dy
    		}));
    	}

    	function handlePanEnd() {
    		coords.set({ x: 0, y: 0 });
    		$$invalidate(1, isPanMove = false);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MelvynxLogoAnim> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		spring,
    		MelvynxLogoSvg,
    		pannable,
    		fade,
    		coords,
    		isPanMove,
    		handlePanStart,
    		handlePanMove,
    		handlePanEnd,
    		$coords
    	});

    	$$self.$inject_state = $$props => {
    		if ("coords" in $$props) $$invalidate(0, coords = $$props.coords);
    		if ("isPanMove" in $$props) $$invalidate(1, isPanMove = $$props.isPanMove);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [coords, isPanMove, $coords, handlePanStart, handlePanMove, handlePanEnd];
    }

    class MelvynxLogoAnim extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MelvynxLogoAnim",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    function typewriter(node, { speed = 75 }) {
      const valid =
        node.childNodes.length === 1 && node.childNodes[0].nodeType === Node.TEXT_NODE;

      if (!valid) {
        throw new Error(
          `This transition only works on elements with a single text node child`
        );
      }

      const text = node.textContent;
      const duration = text.length * speed;

      return {
        duration,
        tick: (t) => {
          const i = Math.round(text.length * t);
          node.textContent = text.slice(0, i);
          if (t === 1) node.dispatchEvent(new CustomEvent('typewritterfinish'));
        },
      };
    }

    /* src/animation/WrittingEffect.svelte generated by Svelte v3.31.2 */
    const file$2 = "src/animation/WrittingEffect.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (31:20) 
    function create_if_block_2(ctx) {
    	let p;
    	let t;
    	let p_class_value;
    	let p_intro;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*text*/ ctx[0]);
    			attr_dev(p, "class", p_class_value = "" + (null_to_empty(/*className*/ ctx[1]) + " svelte-1rpgcem"));
    			add_location(p, file$2, 31, 4, 680);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*text*/ 1) set_data_dev(t, /*text*/ ctx[0]);

    			if (dirty & /*className*/ 2 && p_class_value !== (p_class_value = "" + (null_to_empty(/*className*/ ctx[1]) + " svelte-1rpgcem"))) {
    				attr_dev(p, "class", p_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (!p_intro) {
    				add_render_callback(() => {
    					p_intro = create_in_transition(p, typewriter, {});
    					p_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(31:20) ",
    		ctx
    	});

    	return block;
    }

    // (19:2) {#if splitedText.length > 1}
    function create_if_block$1(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let each_value = /*splitedText*/ ctx[3];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*mytext*/ ctx[5];
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*className, visible, splitedText*/ 14) {
    				each_value = /*splitedText*/ ctx[3];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, destroy_block, create_each_block, each_1_anchor, get_each_context);
    			}
    		},
    		i: function intro(local) {
    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(19:2) {#if splitedText.length > 1}",
    		ctx
    	});

    	return block;
    }

    // (27:6) {:else}
    function create_else_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			attr_dev(p, "class", "svelte-1rpgcem");
    			add_location(p, file$2, 27, 8, 625);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(27:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (21:6) {#if visible >= i + 1}
    function create_if_block_1(ctx) {
    	let p;
    	let t_value = /*mytext*/ ctx[5] + "";
    	let t;
    	let p_class_value;
    	let p_intro;
    	let mounted;
    	let dispose;

    	function typewritterfinish_handler() {
    		return /*typewritterfinish_handler*/ ctx[4](/*i*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "class", p_class_value = "" + (null_to_empty(/*className*/ ctx[1]) + " svelte-1rpgcem"));
    			add_location(p, file$2, 21, 8, 469);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);

    			if (!mounted) {
    				dispose = listen_dev(p, "typewritterfinish", typewritterfinish_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*splitedText*/ 8 && t_value !== (t_value = /*mytext*/ ctx[5] + "")) set_data_dev(t, t_value);

    			if (dirty & /*className*/ 2 && p_class_value !== (p_class_value = "" + (null_to_empty(/*className*/ ctx[1]) + " svelte-1rpgcem"))) {
    				attr_dev(p, "class", p_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (!p_intro) {
    				add_render_callback(() => {
    					p_intro = create_in_transition(p, typewriter, {});
    					p_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(21:6) {#if visible >= i + 1}",
    		ctx
    	});

    	return block;
    }

    // (20:4) {#each splitedText as mytext, i (mytext)}
    function create_each_block(key_1, ctx) {
    	let first;
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*visible*/ ctx[2] >= /*i*/ ctx[7] + 1) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if_block.c();
    			if_block_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: function intro(local) {
    			transition_in(if_block);
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(20:4) {#each splitedText as mytext, i (mytext)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*splitedText*/ ctx[3].length > 1) return create_if_block$1;
    		if (/*visible*/ ctx[2]) return create_if_block_2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "svelte-1rpgcem");
    			add_location(div, file$2, 17, 0, 349);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			transition_in(if_block);
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			if (if_block) {
    				if_block.d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let splitedText;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("WrittingEffect", slots, []);
    	let { text = "default text" } = $$props;
    	let { className = "" } = $$props;
    	let visible = 0;

    	onMount(() => {
    		const timeout = setTimeout(() => $$invalidate(2, visible = 1), 500);
    		return () => clearTimeout(timeout);
    	});

    	const writable_props = ["text", "className"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<WrittingEffect> was created with unknown prop '${key}'`);
    	});

    	const typewritterfinish_handler = i => $$invalidate(2, visible = i + 2);

    	$$self.$$set = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("className" in $$props) $$invalidate(1, className = $$props.className);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		typewriter,
    		text,
    		className,
    		visible,
    		splitedText
    	});

    	$$self.$inject_state = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("className" in $$props) $$invalidate(1, className = $$props.className);
    		if ("visible" in $$props) $$invalidate(2, visible = $$props.visible);
    		if ("splitedText" in $$props) $$invalidate(3, splitedText = $$props.splitedText);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*text*/ 1) {
    			 $$invalidate(3, splitedText = text.split("\n"));
    		}
    	};

    	return [text, className, visible, splitedText, typewritterfinish_handler];
    }

    class WrittingEffect extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { text: 0, className: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WrittingEffect",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get text() {
    		throw new Error("<WrittingEffect>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<WrittingEffect>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get className() {
    		throw new Error("<WrittingEffect>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set className(value) {
    		throw new Error("<WrittingEffect>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/animation/ParticulesAnim.svelte generated by Svelte v3.31.2 */

    const { window: window_1 } = globals;
    const file$3 = "src/animation/ParticulesAnim.svelte";

    // (173:0) {#if displayAnimation}
    function create_if_block$2(ctx) {
    	let canvas_1;

    	const block = {
    		c: function create() {
    			canvas_1 = element("canvas");
    			attr_dev(canvas_1, "class", "svelte-o6qtot");
    			add_location(canvas_1, file$3, 173, 2, 4544);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, canvas_1, anchor);
    			/*canvas_1_binding*/ ctx[7](canvas_1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(canvas_1);
    			/*canvas_1_binding*/ ctx[7](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(173:0) {#if displayAnimation}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let if_block_anchor;
    	let mounted;
    	let dispose;
    	let if_block = /*displayAnimation*/ ctx[0] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(window_1, "mousemove", /*handleMouseMove*/ ctx[3], false, false, false),
    					listen_dev(window_1, "resize", /*handleResize*/ ctx[4], false, false, false),
    					listen_dev(window_1, "mouseout", /*mouseout_handler*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*displayAnimation*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const speed = 10;
    const mouseRadiusDividend = 100;

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ParticulesAnim", slots, []);
    	let { displayAnimation = true } = $$props;
    	let canvas;
    	let ctx;
    	let particules;
    	let isAnimationRunning = true;
    	let mouse = { x: null, y: null, radius: null };

    	function onStartAnimation() {
    		ctx = canvas.getContext("2d");
    		$$invalidate(1, canvas.width = window.innerWidth, canvas);
    		$$invalidate(1, canvas.height = window.innerHeight, canvas);
    		$$invalidate(2, mouse.radius = canvas?.height / mouseRadiusDividend * (canvas?.width / mouseRadiusDividend), mouse);
    		initAnimation();
    		animate();
    	}

    	onMount(() => {
    		onStartAnimation();
    	});

    	function handleMouseMove(event) {
    		$$invalidate(2, mouse.x = event.x, mouse);
    		$$invalidate(2, mouse.y = event.y, mouse);
    	}

    	function handleResize() {
    		if (!displayAnimation) return;
    		$$invalidate(1, canvas.width = window.innerWidth, canvas);
    		$$invalidate(1, canvas.height = window.innerHeight, canvas);

    		$$invalidate(2, mouse = {
    			radius: canvas?.height / mouseRadiusDividend * (canvas?.width / mouseRadiusDividend),
    			...mouse
    		});
    	}

    	class Particle {
    		constructor(x, y, directionX, directionY, size, color) {
    			this.x = x;
    			this.y = y;
    			this.directionX = directionX;
    			this.directionY = directionY;
    			this.size = size;
    		}

    		// draw particule
    		draw() {
    			ctx.beginPath();
    			ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
    			ctx.fillStyle = "#485460";
    			ctx.fill();
    		}

    		// update place of particules
    		update() {
    			if (this.x > canvas.width || this.x < 0) {
    				this.directionX = -this.directionX;
    			}

    			if (this.y > canvas.height || this.x < 0) {
    				this.directionY = -this.directionY;
    			}

    			// check collision
    			let dx = mouse.x - this.x;

    			let dy = mouse.y - this.y;
    			let distance = Math.sqrt(dx * dx + dy * dy);

    			if (distance < mouse.radius + this.size) {
    				if (mouse.x < this.x && this.x < canvas.width - this.size * speed) {
    					this.x += speed;
    					this.directionX = -this.directionX;
    				}

    				if (mouse.x > this.x && this.x > this.size * speed) {
    					this.directionX = -this.directionX;
    					this.x -= speed;
    				}

    				if (mouse.y < this.y && this.y < canvas.width - this.size * speed) {
    					this.y += speed;
    					this.directionY = -this.directionY;
    				}

    				if (mouse.y > this.y && this.y > this.size * speed) {
    					this.y -= speed;
    					this.directionY = -this.directionY;
    				}
    			}

    			this.x += this.directionX;
    			this.y += this.directionY;
    			this.draw();
    		}
    	}

    	function initAnimation() {
    		$$invalidate(5, isAnimationRunning = true);
    		particules = [];
    		let numberOfParticles = canvas.height * canvas.width / 15000;

    		for (let i = 0; i < numberOfParticles; i++) {
    			let size = Math.random() * 6 + 1;
    			let x = Math.random() * (window.innerWidth - size * 2 - size * 2) + size * 2;
    			let y = Math.random() * (window.innerHeight - size * 2 - size * 2) + size * 2;
    			let directionX = Math.random() * 5 - 2.5;
    			let directionY = Math.random() * 5 - 2.5;
    			particules = particules.concat(new Particle(x, y, directionX, directionY, size));
    		}
    	}

    	function animate() {
    		if (!displayAnimation) return;
    		requestAnimationFrame(animate);
    		ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    		ctx.fillStyle = "#1d1d1d";
    		ctx.fillRect(0, 0, canvas.width, canvas.height);
    		particules.forEach(particule => particule.update());
    		connect();
    	}

    	function connect() {
    		for (let a = 0; a < particules.length; a++) {
    			for (let b = a; b < particules.length; b++) {
    				let distance = (particules[a].x - particules[b].x) * (particules[a].x - particules[b].x) + (particules[a].y - particules[b].y) * (particules[a].y - particules[b].y);

    				if (distance < canvas.width / 9 * (canvas.height / 9)) {
    					ctx.strokeStyle = `rgba(52,73,94, ${1 - distance / 20000})`;
    					ctx.lineWidth = 1;
    					ctx.beginPath();
    					ctx.moveTo(particules[a].x, particules[a].y);
    					ctx.lineTo(particules[b].x, particules[b].y);
    					ctx.stroke();
    				}
    			}
    		}
    	}

    	const writable_props = ["displayAnimation"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ParticulesAnim> was created with unknown prop '${key}'`);
    	});

    	const mouseout_handler = () => $$invalidate(2, mouse = { x: undefined, y: undefined, ...mouse });

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			canvas = $$value;
    			$$invalidate(1, canvas);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("displayAnimation" in $$props) $$invalidate(0, displayAnimation = $$props.displayAnimation);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		displayAnimation,
    		speed,
    		mouseRadiusDividend,
    		canvas,
    		ctx,
    		particules,
    		isAnimationRunning,
    		mouse,
    		onStartAnimation,
    		handleMouseMove,
    		handleResize,
    		Particle,
    		initAnimation,
    		animate,
    		connect
    	});

    	$$self.$inject_state = $$props => {
    		if ("displayAnimation" in $$props) $$invalidate(0, displayAnimation = $$props.displayAnimation);
    		if ("canvas" in $$props) $$invalidate(1, canvas = $$props.canvas);
    		if ("ctx" in $$props) ctx = $$props.ctx;
    		if ("particules" in $$props) particules = $$props.particules;
    		if ("isAnimationRunning" in $$props) $$invalidate(5, isAnimationRunning = $$props.isAnimationRunning);
    		if ("mouse" in $$props) $$invalidate(2, mouse = $$props.mouse);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*displayAnimation, isAnimationRunning, canvas*/ 35) {
    			 if (displayAnimation) {
    				if (!isAnimationRunning) {
    					if (canvas) {
    						onStartAnimation();
    					}
    				}
    			} else {
    				$$invalidate(5, isAnimationRunning = false);
    			}
    		}
    	};

    	return [
    		displayAnimation,
    		canvas,
    		mouse,
    		handleMouseMove,
    		handleResize,
    		isAnimationRunning,
    		mouseout_handler,
    		canvas_1_binding
    	];
    }

    class ParticulesAnim extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { displayAnimation: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ParticulesAnim",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get displayAnimation() {
    		throw new Error("<ParticulesAnim>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set displayAnimation(value) {
    		throw new Error("<ParticulesAnim>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/background/LabelCheckbox.svelte generated by Svelte v3.31.2 */

    const file$4 = "src/background/LabelCheckbox.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let label_1;
    	let t0;
    	let t1;
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			label_1 = element("label");
    			t0 = text(/*label*/ ctx[2]);
    			t1 = space();
    			input = element("input");
    			attr_dev(label_1, "for", /*id*/ ctx[1]);
    			attr_dev(label_1, "class", "svelte-9yzzym");
    			add_location(label_1, file$4, 7, 2, 170);
    			attr_dev(input, "id", /*id*/ ctx[1]);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "class", "svelte-9yzzym");
    			add_location(input, file$4, 8, 2, 204);
    			attr_dev(div, "class", "label-checkbox-container svelte-9yzzym");
    			add_location(div, file$4, 6, 0, 129);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label_1);
    			append_dev(label_1, t0);
    			append_dev(div, t1);
    			append_dev(div, input);
    			input.checked = /*checked*/ ctx[0];

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*input_change_handler*/ ctx[3]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*label*/ 4) set_data_dev(t0, /*label*/ ctx[2]);

    			if (dirty & /*id*/ 2) {
    				attr_dev(label_1, "for", /*id*/ ctx[1]);
    			}

    			if (dirty & /*id*/ 2) {
    				attr_dev(input, "id", /*id*/ ctx[1]);
    			}

    			if (dirty & /*checked*/ 1) {
    				input.checked = /*checked*/ ctx[0];
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("LabelCheckbox", slots, []);
    	let { checked } = $$props;
    	let { id = "label-checkbox-default-id" } = $$props;
    	let { label = "Default label :" } = $$props;
    	const writable_props = ["checked", "id", "label"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<LabelCheckbox> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		checked = this.checked;
    		$$invalidate(0, checked);
    	}

    	$$self.$$set = $$props => {
    		if ("checked" in $$props) $$invalidate(0, checked = $$props.checked);
    		if ("id" in $$props) $$invalidate(1, id = $$props.id);
    		if ("label" in $$props) $$invalidate(2, label = $$props.label);
    	};

    	$$self.$capture_state = () => ({ checked, id, label });

    	$$self.$inject_state = $$props => {
    		if ("checked" in $$props) $$invalidate(0, checked = $$props.checked);
    		if ("id" in $$props) $$invalidate(1, id = $$props.id);
    		if ("label" in $$props) $$invalidate(2, label = $$props.label);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [checked, id, label, input_change_handler];
    }

    class LabelCheckbox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { checked: 0, id: 1, label: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LabelCheckbox",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*checked*/ ctx[0] === undefined && !("checked" in props)) {
    			console.warn("<LabelCheckbox> was created without expected prop 'checked'");
    		}
    	}

    	get checked() {
    		throw new Error("<LabelCheckbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set checked(value) {
    		throw new Error("<LabelCheckbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<LabelCheckbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<LabelCheckbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<LabelCheckbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<LabelCheckbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/background/BackgroundApp.svelte generated by Svelte v3.31.2 */
    const file$5 = "src/background/BackgroundApp.svelte";

    function create_fragment$5(ctx) {
    	let particulesanim;
    	let t0;
    	let div1;
    	let labelcheckbox;
    	let updating_checked;
    	let t1;
    	let div0;
    	let current;

    	particulesanim = new ParticulesAnim({
    			props: {
    				displayAnimation: /*displayAnimation*/ ctx[0]
    			},
    			$$inline: true
    		});

    	function labelcheckbox_checked_binding(value) {
    		/*labelcheckbox_checked_binding*/ ctx[3].call(null, value);
    	}

    	let labelcheckbox_props = {
    		label: "Display animations :",
    		id: "display-animation-checkbox"
    	};

    	if (/*displayAnimation*/ ctx[0] !== void 0) {
    		labelcheckbox_props.checked = /*displayAnimation*/ ctx[0];
    	}

    	labelcheckbox = new LabelCheckbox({
    			props: labelcheckbox_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(labelcheckbox, "checked", labelcheckbox_checked_binding));
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			create_component(particulesanim.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			create_component(labelcheckbox.$$.fragment);
    			t1 = space();
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "centred-child svelte-l4i8cw");
    			add_location(div0, file$5, 14, 2, 375);
    			attr_dev(div1, "class", "full-width-container svelte-l4i8cw");
    			add_location(div1, file$5, 8, 0, 211);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(particulesanim, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			mount_component(labelcheckbox, div1, null);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const particulesanim_changes = {};
    			if (dirty & /*displayAnimation*/ 1) particulesanim_changes.displayAnimation = /*displayAnimation*/ ctx[0];
    			particulesanim.$set(particulesanim_changes);
    			const labelcheckbox_changes = {};

    			if (!updating_checked && dirty & /*displayAnimation*/ 1) {
    				updating_checked = true;
    				labelcheckbox_changes.checked = /*displayAnimation*/ ctx[0];
    				add_flush_callback(() => updating_checked = false);
    			}

    			labelcheckbox.$set(labelcheckbox_changes);

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(particulesanim.$$.fragment, local);
    			transition_in(labelcheckbox.$$.fragment, local);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(particulesanim.$$.fragment, local);
    			transition_out(labelcheckbox.$$.fragment, local);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(particulesanim, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			destroy_component(labelcheckbox);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("BackgroundApp", slots, ['default']);
    	let displayAnimation = true;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<BackgroundApp> was created with unknown prop '${key}'`);
    	});

    	function labelcheckbox_checked_binding(value) {
    		displayAnimation = value;
    		$$invalidate(0, displayAnimation);
    	}

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		ParticulesAnim,
    		LabelCheckbox,
    		displayAnimation
    	});

    	$$self.$inject_state = $$props => {
    		if ("displayAnimation" in $$props) $$invalidate(0, displayAnimation = $$props.displayAnimation);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [displayAnimation, $$scope, slots, labelcheckbox_checked_binding];
    }

    class BackgroundApp extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BackgroundApp",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/github-page/GithubPageCard.svelte generated by Svelte v3.31.2 */

    const file$6 = "src/github-page/GithubPageCard.svelte";

    function create_fragment$6(ctx) {
    	let div1;
    	let a;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let h2;
    	let t1_value = /*page*/ ctx[0].title + "";
    	let t1;
    	let t2;
    	let p;
    	let t3_value = /*page*/ ctx[0].description + "";
    	let t3;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			a = element("a");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			h2 = element("h2");
    			t1 = text(t1_value);
    			t2 = space();
    			p = element("p");
    			t3 = text(t3_value);
    			if (img.src !== (img_src_value = /*page*/ ctx[0].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "githubpage card img");
    			attr_dev(img, "class", "svelte-10emrz8");
    			add_location(img, file$6, 13, 6, 267);
    			attr_dev(div0, "class", "img-wrapper svelte-10emrz8");
    			add_location(div0, file$6, 12, 4, 235);
    			attr_dev(h2, "class", "svelte-10emrz8");
    			add_location(h2, file$6, 15, 4, 333);
    			attr_dev(p, "class", "svelte-10emrz8");
    			add_location(p, file$6, 16, 4, 359);
    			attr_dev(a, "href", a_href_value = /*page*/ ctx[0].url);
    			attr_dev(a, "class", "svelte-10emrz8");
    			add_location(a, file$6, 11, 2, 211);
    			attr_dev(div1, "class", "card-wrapper svelte-10emrz8");
    			add_location(div1, file$6, 10, 0, 182);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, a);
    			append_dev(a, div0);
    			append_dev(div0, img);
    			append_dev(a, t0);
    			append_dev(a, h2);
    			append_dev(h2, t1);
    			append_dev(a, t2);
    			append_dev(a, p);
    			append_dev(p, t3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*page*/ 1 && img.src !== (img_src_value = /*page*/ ctx[0].image)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*page*/ 1 && t1_value !== (t1_value = /*page*/ ctx[0].title + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*page*/ 1 && t3_value !== (t3_value = /*page*/ ctx[0].description + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*page*/ 1 && a_href_value !== (a_href_value = /*page*/ ctx[0].url)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("GithubPageCard", slots, []);

    	let { page = {
    		id: 0,
    		title: "title",
    		description: "default description",
    		image: "images/snakouz.png",
    		url: "https://google.com"
    	} } = $$props;

    	const writable_props = ["page"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<GithubPageCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    	};

    	$$self.$capture_state = () => ({ page });

    	$$self.$inject_state = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [page];
    }

    class GithubPageCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { page: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GithubPageCard",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get page() {
    		throw new Error("<GithubPageCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set page(value) {
    		throw new Error("<GithubPageCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const mainText =
      'Here are the different sites you can find on my github pages.';

    const githubpages = [
      {
        id: 1,
        title: 'Tools VueJS',
        description: 'Small VueJS application that includes a timer and other stuff.',
        image: 'images/tools-vuejs.png',
        url: 'https://melvynx.github.io/VueJSTools',
      },
      {
        id: 2,
        title: 'Snakouz',
        description: 'Snake made in pure JSS / CSS in order to learn the canvas.',
        image: 'images/snakouz.png',
        url: 'https://melvynx.github.io/SnakouzJS',
      },
      {
        id: 3,
        title: 'Note VueJS',
        description: 'Note application made in VueJS to learn how to use a Framework.',
        image: 'images/notesvuejs.png',
        url: 'https://melvynx.github.io/NotesVueApp',
      },
      {
        id: 4,
        title: 'VonQey',
        description:
          'Application to learn React that includes a base convertor and other stuff.',
        image: 'images/vonqey.png',
        url: 'https://melvynx.github.io/ReactTools',
      },
    ];

    /* src/github-page/GithubPageCards.svelte generated by Svelte v3.31.2 */
    const file$7 = "src/github-page/GithubPageCards.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i];
    	return child_ctx;
    }

    // (7:2) {#each githubpages as page}
    function create_each_block$1(ctx) {
    	let githubpagecard;
    	let current;

    	githubpagecard = new GithubPageCard({
    			props: { page: /*page*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(githubpagecard.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(githubpagecard, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(githubpagecard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(githubpagecard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(githubpagecard, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(7:2) {#each githubpages as page}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div;
    	let current;
    	let each_value = githubpages;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "github-pages-container svelte-1e078ur");
    			add_location(div, file$7, 5, 0, 125);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*githubpages*/ 0) {
    				each_value = githubpages;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("GithubPageCards", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<GithubPageCards> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ githubpages, GithubPageCard });
    	return [];
    }

    class GithubPageCards extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GithubPageCards",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.31.2 */
    const file$8 = "src/App.svelte";

    // (11:2) <BackgroundApp>
    function create_default_slot(ctx) {
    	let div;
    	let melvynxlogo;
    	let t0;
    	let writtingeffect;
    	let t1;
    	let githubpagecards;
    	let current;
    	melvynxlogo = new MelvynxLogoAnim({ $$inline: true });

    	writtingeffect = new WrittingEffect({
    			props: { text: mainText },
    			$$inline: true
    		});

    	githubpagecards = new GithubPageCards({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(melvynxlogo.$$.fragment);
    			t0 = space();
    			create_component(writtingeffect.$$.fragment);
    			t1 = space();
    			create_component(githubpagecards.$$.fragment);
    			attr_dev(div, "class", "logo-container svelte-133xpue");
    			add_location(div, file$8, 11, 4, 452);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(melvynxlogo, div, null);
    			insert_dev(target, t0, anchor);
    			mount_component(writtingeffect, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(githubpagecards, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(melvynxlogo.$$.fragment, local);
    			transition_in(writtingeffect.$$.fragment, local);
    			transition_in(githubpagecards.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(melvynxlogo.$$.fragment, local);
    			transition_out(writtingeffect.$$.fragment, local);
    			transition_out(githubpagecards.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(melvynxlogo);
    			if (detaching) detach_dev(t0);
    			destroy_component(writtingeffect, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(githubpagecards, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(11:2) <BackgroundApp>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let main;
    	let backgroundapp;
    	let current;

    	backgroundapp = new BackgroundApp({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(backgroundapp.$$.fragment);
    			attr_dev(main, "class", "app svelte-133xpue");
    			add_location(main, file$8, 9, 0, 411);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(backgroundapp, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const backgroundapp_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				backgroundapp_changes.$$scope = { dirty, ctx };
    			}

    			backgroundapp.$set(backgroundapp_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(backgroundapp.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(backgroundapp.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(backgroundapp);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		MelvynxLogo: MelvynxLogoAnim,
    		WrittingEffect,
    		BackgroundApp,
    		GithubPageCard,
    		GithubPageCards,
    		mainText,
    		githubpages
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
