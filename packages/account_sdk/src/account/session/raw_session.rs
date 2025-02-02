use cainome::cairo_serde::CairoSerde;
use starknet::core::types::Felt;
use starknet::macros::{selector, short_string};
use starknet_crypto::poseidon_hash_many;

use crate::{
    abigen::controller::SignerSignature,
    hash::{MessageHashRev1, StarknetDomain, StructHashRev1},
};

pub type RawSession = crate::abigen::controller::Session;

impl StructHashRev1 for RawSession {
    fn get_struct_hash_rev_1(&self) -> Felt {
        poseidon_hash_many(&[
            Self::TYPE_HASH_REV_1,
            self.expires_at.into(),
            self.allowed_methods_root,
            self.metadata_hash,
            self.session_key_guid,
        ])
    }

    const TYPE_HASH_REV_1: Felt = selector!(
        "\"Session\"(\"Expires At\":\"timestamp\",\"Allowed Methods\":\"merkletree\",\"Metadata\":\"string\",\"Session Key\":\"felt\")"
    );
}

impl MessageHashRev1 for RawSession {
    fn get_message_hash_rev_1(&self, chain_id: Felt, contract_address: Felt) -> Felt {
        let domain = StarknetDomain {
            name: short_string!("SessionAccount.session"),
            version: short_string!("1"),
            chain_id,
            revision: Felt::ONE,
        };
        poseidon_hash_many(&[
            short_string!("StarkNet Message"),
            domain.get_struct_hash_rev_1(),
            contract_address,
            self.get_struct_hash_rev_1(),
        ])
    }
}

#[derive(Clone, Debug, PartialEq)]
pub struct RawSessionToken {
    pub(crate) session: RawSession,
    pub(crate) session_authorization: Vec<Felt>,
    pub(crate) session_signature: SignerSignature,
    pub(crate) guardian_signature: SignerSignature,
    pub(crate) proofs: Vec<Vec<Felt>>,
}

impl CairoSerde for RawSessionToken {
    type RustType = Self;

    fn cairo_serialized_size(rust: &Self::RustType) -> usize {
        RawSession::cairo_serialized_size(&rust.session)
            + <Vec<Felt>>::cairo_serialized_size(&rust.session_authorization)
            + SignerSignature::cairo_serialized_size(&rust.session_signature)
            + SignerSignature::cairo_serialized_size(&rust.guardian_signature)
            + <Vec<Vec<Felt>>>::cairo_serialized_size(&rust.proofs)
    }

    fn cairo_serialize(rust: &Self::RustType) -> Vec<Felt> {
        [
            RawSession::cairo_serialize(&rust.session),
            <Vec<Felt>>::cairo_serialize(&rust.session_authorization),
            SignerSignature::cairo_serialize(&rust.session_signature),
            SignerSignature::cairo_serialize(&rust.guardian_signature),
            <Vec<Vec<Felt>>>::cairo_serialize(&rust.proofs),
        ]
        .concat()
    }

    fn cairo_deserialize(
        felts: &[Felt],
        mut offset: usize,
    ) -> cainome::cairo_serde::Result<Self::RustType> {
        let session = RawSession::cairo_deserialize(felts, offset)?;
        offset += RawSession::cairo_serialized_size(&session);
        let session_authorization = <Vec<Felt>>::cairo_deserialize(felts, offset)?;
        offset += <Vec<Felt>>::cairo_serialized_size(&session_authorization);
        let session_signature = SignerSignature::cairo_deserialize(felts, offset)?;
        offset += SignerSignature::cairo_serialized_size(&session_signature);
        let guardian_signature = SignerSignature::cairo_deserialize(felts, offset)?;
        offset += SignerSignature::cairo_serialized_size(&guardian_signature);
        let proofs = <Vec<Vec<Felt>>>::cairo_deserialize(felts, offset)?;

        Ok(Self {
            session,
            session_authorization,
            session_signature,
            guardian_signature,
            proofs,
        })
    }
}
