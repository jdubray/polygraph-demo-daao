// safety_engine.rs – idiomatic Rust implementation of the Action Order workflow.
// Standard library only.  Behaviourally identical to the Python version.

use std::collections::HashMap;
use std::env;
use std::fs;
use std::io::{self, BufRead, Write};
use std::path::Path;

const STORE_FILE: &str = "store.json";

#[derive(Debug, Clone, PartialEq, Eq)]
enum State {
    Draft,
    PendingApproval,
    Approved,
    Released,
    Acknowledged,
    Executed,
    Closed,
    Aborted,
    Expired,
}

impl State {
    fn as_str(&self) -> &'static str {
        match self {
            State::Draft => "DRAFT",
            State::PendingApproval => "PENDING_APPROVAL",
            State::Approved => "APPROVED",
            State::Released => "RELEASED",
            State::Acknowledged => "ACKNOWLEDGED",
            State::Executed => "EXECUTED",
            State::Closed => "CLOSED",
            State::Aborted => "ABORTED",
            State::Expired => "EXPIRED",
        }
    }

    fn from_str(s: &str) -> Option<State> {
        match s {
            "DRAFT" => Some(State::Draft),
            "PENDING_APPROVAL" => Some(State::PendingApproval),
            "APPROVED" => Some(State::Approved),
            "RELEASED" => Some(State::Released),
            "ACKNOWLEDGED" => Some(State::Acknowledged),
            "EXECUTED" => Some(State::Executed),
            "CLOSED" => Some(State::Closed),
            "ABORTED" => Some(State::Aborted),
            "EXPIRED" => Some(State::Expired),
            _ => None,
        }
    }
}

#[derive(Debug, Clone)]
struct Order {
    id: String,
    proposer: Option<String>,
    approvers: Vec<String>,
    window_start: Option<i64>,
    window_end: Option<i64>,
    state: State,
}

#[derive(Debug, Clone)]
struct Effect {
    effect: String, // "transmit" or "execute"
    order: String,
}

#[derive(Debug, Clone)]
struct Store {
    orders: HashMap<String, Order>,
    effects: Vec<Effect>,
}

// ---------------------------------------------------------------------------
// minimal JSON parser for the limited needs of this program
// ---------------------------------------------------------------------------

#[derive(Debug)]
enum JsonValue {
    Object(HashMap<String, JsonValue>),
    Array(Vec<JsonValue>),
    String(String),
    Number(i64),
    Bool(bool),
    Null,
}

struct JsonParser {
    chars: Vec<char>,
    pos: usize,
}

impl JsonParser {
    fn new(input: &str) -> Self {
        JsonParser {
            chars: input.chars().collect(),
            pos: 0,
        }
    }

    fn skip_whitespace(&mut self) {
        while self.pos < self.chars.len() && self.chars[self.pos].is_whitespace() {
            self.pos += 1;
        }
    }

    fn peek(&self) -> Option<char> {
        self.chars.get(self.pos).copied()
    }

    fn next(&mut self) -> Option<char> {
        let ch = self.chars.get(self.pos).copied();
        self.pos += 1;
        ch
    }

    fn expect(&mut self, expected: char) -> Result<(), String> {
        match self.next() {
            Some(ch) if ch == expected => Ok(()),
            Some(ch) => Err(format!("expected '{}', found '{}'", expected, ch)),
            None => Err("unexpected end of input".into()),
        }
    }

    fn parse_value(&mut self) -> Result<JsonValue, String> {
        self.skip_whitespace();
        match self.peek() {
            Some('"') => Ok(JsonValue::String(self.parse_string()?)),
            Some('{') => self.parse_object(),
            Some('[') => self.parse_array(),
            Some('t') | Some('f') => self.parse_bool(),
            Some('n') => self.parse_null(),
            Some(c) if c.is_ascii_digit() || c == '-' => {
                let num = self.parse_number()?;
                Ok(JsonValue::Number(num))
            }
            Some(c) => Err(format!("unexpected character: '{}'", c)),
            None => Err("unexpected end of input".into()),
        }
    }

    fn parse_string(&mut self) -> Result<String, String> {
        self.expect('"')?;
        let mut s = String::new();
        loop {
            match self.next() {
                Some('"') => break,
                Some('\\') => {
                    match self.next() {
                        Some('"') => s.push('"'),
                        Some('\\') => s.push('\\'),
                        Some('/') => s.push('/'),
                        Some('b') => s.push('\u{0008}'),
                        Some('f') => s.push('\u{000C}'),
                        Some('n') => s.push('\n'),
                        Some('r') => s.push('\r'),
                        Some('t') => s.push('\t'),
                        Some('u') => {
                            return Err("unicode escapes not supported".into());
                        }
                        Some(c) => return Err(format!("invalid escape \\{}", c)),
                        None => return Err("unexpected end of string".into()),
                    }
                }
                Some(c) => s.push(c),
                None => return Err("unterminated string".into()),
            }
        }
        Ok(s)
    }

    fn parse_number(&mut self) -> Result<i64, String> {
        let start = self.pos;
        if self.peek() == Some('-') {
            self.pos += 1;
        }
        while self.pos < self.chars.len() && self.chars[self.pos].is_ascii_digit() {
            self.pos += 1;
        }
        let num_str: String = self.chars[start..self.pos].iter().collect();
        num_str
            .parse::<i64>()
            .map_err(|e| format!("invalid number: {}", e))
    }

    fn parse_object(&mut self) -> Result<JsonValue, String> {
        self.expect('{')?;
        let mut map = HashMap::new();
        self.skip_whitespace();
        if self.peek() == Some('}') {
            self.pos += 1;
            return Ok(JsonValue::Object(map));
        }
        loop {
            self.skip_whitespace();
            let key = self.parse_string()?;
            self.skip_whitespace();
            self.expect(':')?;
            let val = self.parse_value()?;
            map.insert(key, val);
            self.skip_whitespace();
            match self.next() {
                Some(',') => continue,
                Some('}') => break,
                Some(c) => return Err(format!("expected ',' or '}}', found '{}'", c)),
                None => return Err("unterminated object".into()),
            }
        }
        Ok(JsonValue::Object(map))
    }

    fn parse_array(&mut self) -> Result<JsonValue, String> {
        self.expect('[')?;
        let mut arr = Vec::new();
        self.skip_whitespace();
        if self.peek() == Some(']') {
            self.pos += 1;
            return Ok(JsonValue::Array(arr));
        }
        loop {
            let val = self.parse_value()?;
            arr.push(val);
            self.skip_whitespace();
            match self.next() {
                Some(',') => continue,
                Some(']') => break,
                Some(c) => return Err(format!("expected ',' or ']', found '{}'", c)),
                None => return Err("unterminated array".into()),
            }
        }
        Ok(JsonValue::Array(arr))
    }

    fn parse_bool(&mut self) -> Result<JsonValue, String> {
        if self.chars[self.pos..].starts_with(&['t', 'r', 'u', 'e']) {
            self.pos += 4;
            Ok(JsonValue::Bool(true))
        } else if self.chars[self.pos..].starts_with(&['f', 'a', 'l', 's', 'e']) {
            self.pos += 5;
            Ok(JsonValue::Bool(false))
        } else {
            Err("invalid boolean".into())
        }
    }

    fn parse_null(&mut self) -> Result<JsonValue, String> {
        if self.chars[self.pos..].starts_with(&['n', 'u', 'l', 'l']) {
            self.pos += 4;
            Ok(JsonValue::Null)
        } else {
            Err("invalid null".into())
        }
    }
}

// helpers to extract typed values from a JSON object
fn obj_get_string(obj: &HashMap<String, JsonValue>, key: &str) -> Option<String> {
    obj.get(key).and_then(|v| match v {
        JsonValue::String(s) => Some(s.clone()),
        _ => None,
    })
}

fn obj_get_i64(obj: &HashMap<String, JsonValue>, key: &str) -> Option<i64> {
    obj.get(key).and_then(|v| match v {
        JsonValue::Number(n) => Some(*n),
        _ => None,
    })
}

// store serialisation (JSON) – manual but sufficient for our structure
fn store_to_json(store: &Store) -> String {
    let mut out = String::from("{\n  \"orders\": {\n");
    let orders: Vec<_> = store.orders.values().collect();
    for (i, o) in orders.iter().enumerate() {
        let comma = if i < orders.len() - 1 { "," } else { "" };
        out.push_str(&format!(
            "    \"{}\": {{\n      \"id\": \"{}\",\n      \"proposer\": {},\n      \"approvers\": [{}],\n      \"window_start\": {},\n      \"window_end\": {},\n      \"state\": \"{}\"\n    }}{}\n",
            o.id,
            o.id,
            match &o.proposer {
                Some(p) => format!("\"{}\"", p),
                None => "null".to_string(),
            },
            o.approvers
                .iter()
                .map(|a| format!("\"{}\"", a))
                .collect::<Vec<_>>()
                .join(", "),
            match o.window_start {
                Some(v) => v.to_string(),
                None => "null".to_string(),
            },
            match o.window_end {
                Some(v) => v.to_string(),
                None => "null".to_string(),
            },
            o.state.as_str(),
            comma = comma,
        ));
    }
    out.push_str("  },\n  \"effects\": [\n");
    for (i, e) in store.effects.iter().enumerate() {
        let comma = if i < store.effects.len() - 1 { "," } else { "" };
        out.push_str(&format!(
            "    {{\"effect\": \"{}\", \"order\": \"{}\"}}{}\n",
            e.effect, e.order, comma
        ));
    }
    out.push_str("  ]\n}");
    out
}

fn store_from_json(json_str: &str) -> Result<Store, String> {
    let mut parser = JsonParser::new(json_str);
    let val = parser.parse_value()?;
    if let JsonValue::Object(obj) = val {
        let orders_map = match obj.get("orders") {
            Some(JsonValue::Object(o)) => o,
            _ => return Err("missing or invalid 'orders'".into()),
        };
        let effects_arr = match obj.get("effects") {
            Some(JsonValue::Array(a)) => a,
            _ => return Err("missing or invalid 'effects'".into()),
        };

        let mut orders = HashMap::new();
        for (id, order_val) in orders_map {
            if let JsonValue::Object(o) = order_val {
                let proposer = obj_get_string(o, "proposer");
                let approvers: Vec<String> = match o.get("approvers") {
                    Some(JsonValue::Array(arr)) => arr
                        .iter()
                        .filter_map(|v| match v {
                            JsonValue::String(s) => Some(s.clone()),
                            _ => None,
                        })
                        .collect(),
                    _ => vec![],
                };
                let ws = obj_get_i64(o, "window_start");
                let we = obj_get_i64(o, "window_end");
                let state = obj_get_string(o, "state")
                    .and_then(|s| State::from_str(&s))
                    .unwrap_or(State::Draft);
                orders.insert(
                    id.clone(),
                    Order {
                        id: id.clone(),
                        proposer,
                        approvers,
                        window_start: ws,
                        window_end: we,
                        state,
                    },
                );
            }
        }
        let mut effects = Vec::new();
        for e_val in effects_arr {
            if let JsonValue::Object(e) = e_val {
                let effect = obj_get_string(e, "effect").unwrap_or_default();
                let order = obj_get_string(e, "order").unwrap_or_default();
                if !effect.is_empty() && !order.is_empty() {
                    effects.push(Effect { effect, order });
                }
            }
        }
        Ok(Store { orders, effects })
    } else {
        Err("top-level value is not an object".into())
    }
}

fn save_store(store: &Store) -> io::Result<()> {
    let json = store_to_json(store);
    let dir = Path::new(STORE_FILE)
        .parent()
        .unwrap_or_else(|| Path::new("."));
    let mut tmp_path = dir.join(".store_tmp");
    tmp_path = tmp_path.with_extension(format!("tmp{}", std::process::id()));
    fs::write(&tmp_path, &json)?;
    fs::rename(&tmp_path, STORE_FILE)?;
    Ok(())
}

fn load_store() -> Store {
    match fs::read_to_string(STORE_FILE) {
        Ok(content) => store_from_json(&content).unwrap_or(Store {
            orders: HashMap::new(),
            effects: Vec::new(),
        }),
        Err(_) => Store {
            orders: HashMap::new(),
            effects: Vec::new(),
        },
    }
}

fn ensure_order(store: &mut Store, oid: &str) {
    if !store.orders.contains_key(oid) {
        store.orders.insert(
            oid.to_string(),
            Order {
                id: oid.to_string(),
                proposer: None,
                approvers: Vec::new(),
                window_start: None,
                window_end: None,
                state: State::Draft,
            },
        );
    }
}

fn process_event(store: &mut Store, event: &HashMap<String, JsonValue>) -> bool {
    let op = match obj_get_string(event, "op") {
        Some(s) => s,
        None => return false,
    };
    let oid = match obj_get_string(event, "order") {
        Some(s) => s,
        None => return false,
    };
    let t = obj_get_i64(event, "t").unwrap_or(0);
    ensure_order(store, &oid);
    let order = store.orders.get_mut(&oid).unwrap(); // safe, just inserted

    match op.as_str() {
        "submit" => {
            if order.state != State::Draft {
                return false;
            }
            let proposer = obj_get_string(event, "actor");
            let ws = obj_get_i64(event, "window_start");
            let we = obj_get_i64(event, "window_end");
            if proposer.is_none() || ws.is_none() || we.is_none() {
                panic!("submit missing proposer/window");
            }
            order.proposer = proposer;
            order.window_start = ws;
            order.window_end = we;
            order.state = State::PendingApproval;
            true
        }
        "approve" => {
            if order.state != State::PendingApproval {
                return false;
            }
            let approver = match obj_get_string(event, "actor") {
                Some(a) => a,
                None => panic!("approve missing actor"),
            };
            if Some(&approver) == order.proposer.as_ref() {
                return false;
            }
            let ws = order.window_start.unwrap_or(0);
            let we = order.window_end.unwrap_or(0);
            if !(ws <= t && t <= we) {
                return false;
            }
            order.approvers.push(approver);
            if order.approvers.len() >= 2 {
                order.state = State::Approved;
            }
            true
        }
        "release" => {
            if order.state != State::Approved {
                return false;
            }
            let ws = order.window_start.unwrap_or(0);
            let we = order.window_end.unwrap_or(0);
            if !(ws <= t && t <= we) {
                return false;
            }
            store.effects.push(Effect {
                effect: "transmit".into(),
                order: oid.clone(),
            });
            order.state = State::Released;
            true
        }
        "acknowledge" => {
            if order.state != State::Released {
                return false;
            }
            order.state = State::Acknowledged;
            true
        }
        "execute" => {
            if order.state != State::Acknowledged {
                return false;
            }
            let ws = order.window_start.unwrap_or(0);
            let we = order.window_end.unwrap_or(0);
            if !(ws <= t && t <= we) {
                return false;
            }
            store.effects.push(Effect {
                effect: "execute".into(),
                order: oid.clone(),
            });
            order.state = State::Executed;
            true
        }
        "close" => {
            if order.state != State::Executed {
                return false;
            }
            order.state = State::Closed;
            true
        }
        "abort" => {
            if ![
                State::PendingApproval,
                State::Approved,
                State::Released,
                State::Acknowledged,
            ]
            .contains(&order.state)
            {
                return false;
            }
            order.state = State::Aborted;
            true
        }
        "expire" => {
            if ![
                State::PendingApproval,
                State::Approved,
                State::Released,
                State::Acknowledged,
            ]
            .contains(&order.state)
            {
                return false;
            }
            let we = order.window_end.unwrap_or(0);
            if t <= we {
                return false; // not past end
            }
            order.state = State::Expired;
            true
        }
        _ => panic!("unknown op: {}", op),
    }
}

fn main() {
    let args: Vec<String> = env::args().collect();
    let input_path = args.get(1).map(String::as_str);

    let mut store = load_store();

    let stdin = io::stdin();
    let reader: Box<dyn BufRead> = match input_path {
        Some(path) => {
            let file = fs::File::open(path).expect("cannot open input file");
            Box::new(io::BufReader::new(file))
        }
        None => Box::new(stdin.lock()),
    };

    for line in reader.lines() {
        let line = line.expect("failed to read line");
        let line = line.trim().to_string();
        if line.is_empty() {
            continue;
        }
        let mut parser = JsonParser::new(&line);
        let val = parser
            .parse_value()
            .unwrap_or_else(|e| panic!("JSON parse error: {}", e));
        let event = match val {
            JsonValue::Object(m) => m,
            _ => panic!("event is not a JSON object"),
        };
        if process_event(&mut store, &event) {
            save_store(&store).expect("failed to persist store");
        }
    }

    // manual JSON final output (std‑only)
    println!("{{");
    println!("  \"orders\": {{");
    let mut order_iter = store.orders.iter().peekable();
    while let Some((id, o)) = order_iter.next() {
        let comma = if order_iter.peek().is_some() { "," } else { "" };
        print!("    \"{}\": {{", id);
        print!(" \"id\": \"{}\"", o.id);
        print!(", \"proposer\": {}", match &o.proposer {
            Some(p) => format!("\"{}\"", p),
            None => "null".to_string(),
        });
        print!(", \"approvers\": [{}]", o.approvers.iter().map(|a| format!("\"{}\"", a)).collect::<Vec<_>>().join(", "));
        print!(", \"window_start\": {}", match o.window_start {
            Some(v) => v.to_string(),
            None => "null".to_string(),
        });
        print!(", \"window_end\": {}", match o.window_end {
            Some(v) => v.to_string(),
            None => "null".to_string(),
        });
        println!(", \"state\": \"{}\" }}{}", o.state.as_str(), comma);
    }
    println!("  }},");
    println!("  \"effects\": [");
    let mut eff_iter = store.effects.iter().peekable();
    while let Some(e) = eff_iter.next() {
        let comma = if eff_iter.peek().is_some() { "," } else { "" };
        println!("    {{\"effect\": \"{}\", \"order\": \"{}\"}}{}", e.effect, e.order, comma);
    }
    println!("  ]");
    println!("}}");
}